package expo.modules.sonicaudio

import android.media.audiofx.AudioEffect
import android.media.audiofx.Equalizer
import android.media.audiofx.Virtualizer
import android.media.audiofx.LoudnessEnhancer
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.IdentityHashMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlin.math.ln

// UPDATED: Added reactContext to the constructor
class SonicAudioModule(reactContext: ReactApplicationContext) : Module() {
  private var equalizer: Equalizer? = null
  private var virtualizer: Virtualizer? = null
  private var loudnessEnhancer: LoudnessEnhancer? = null

  private var sessionId = 0
  private var sonicEnabled = true
  private var bassAmount = 0
  private var spatialAmount = 0
  private var clarityAmount = 0
  private var preampAmount = 0

  private var equalizerError = ""
  private var spatialError = ""
  private var preampError = ""
  private var lastDiagnostics = ""
  private var eqLevelsDb = MutableList(16) { 0.0 }

  override fun definition() = ModuleDefinition {
    Name("SonicAudio")

    Function("attach") { newSessionId: Int ->
      attachSession(newSessionId)
      capabilities()
    }

    AsyncFunction("attachToPlayer") {
      val foundId = runBlocking(Dispatchers.Main) { findPlayerSessionId() }
      lastDiagnostics = "foundId=$foundId"
      if (foundId > 0) attachSession(foundId)
      capabilities()
    }

    Function("setEnabled") { enabled: Boolean ->
      sonicEnabled = enabled
      applyAllEffects()
      capabilities()
    }

    Function("setEqualizer") { levels: List<Double> ->
      eqLevelsDb = levels.map { it.coerceIn(-12.0, 12.0) }.toMutableList()
      applyAllEffects()
      capabilities()
    }

    Function("setBassBoost") { amount: Int ->
      bassAmount = amount.coerceIn(0, 100)
      applyAllEffects()
      capabilities()
    }

    Function("setClarity") { amount: Int ->
      clarityAmount = amount.coerceIn(0, 100)
      applyAllEffects()
      capabilities()
    }

    Function("setSpatial") { amount: Int ->
      spatialAmount = amount.coerceIn(0, 100)
      applyAllEffects()
      capabilities()
    }

    Function("setPreamp") { amount: Int ->
      preampAmount = amount.coerceIn(-12, 12)
      applyAllEffects()
      capabilities()
    }

    Function("getCapabilities") { capabilities() }
    Function("getDiagnostics") { mapOf("last" to lastDiagnostics) }
    Function("release") { releaseEffects(); sessionId = 0; capabilities() }
  }

  private fun attachSession(newSessionId: Int) {
    if (newSessionId == sessionId && equalizer != null && sessionId > 0) {
      lastDiagnostics = "attach:reuse session=$sessionId"
      applyAllEffects()
      return
    }

    releaseEffects()
    sessionId = newSessionId
    lastDiagnostics = "attach:new session=$newSessionId"

    if (newSessionId <= 0) return

    try {
      virtualizer = Virtualizer(0, newSessionId).also {
        it.enabled = false
        if (!it.strengthSupported) spatialError = "strength not supported"
      }
    } catch (e: Exception) {
      spatialError = e.message ?: "Virtualizer ctor failed"
    }

    try {
      equalizer = Equalizer(0, newSessionId).also {
        it.enabled = false
      }
    } catch (e: Exception) {
      equalizerError = e.message ?: "Equalizer ctor failed"
    }

    try {
      loudnessEnhancer = LoudnessEnhancer(newSessionId).also {
        it.enabled = false
      }
    } catch (e: Exception) {
      preampError = e.message ?: "LoudnessEnhancer ctor failed"
    }

    applyAllEffects()
  }

  private fun applyAllEffects() {
    if (sessionId <= 0) return
    applyEqualizer()
    applySpatial()
    applyPreamp()
  }

  private fun applyEqualizer() {
    val effect = equalizer ?: return
    try {
      val bandCount = effect.numberOfBands.toInt()
      if (bandCount <= 0) return

      val range = effect.bandLevelRange
      val minimum = range[0].toInt()
      val maximum = range[1].toInt()
      val targetFrequencies = doubleArrayOf(
        31.5, 40.0, 63.0, 100.0, 160.0, 250.0, 400.0, 630.0,
        1000.0, 1600.0, 2500.0, 4000.0, 6300.0, 10000.0, 16000.0, 20000.0
      )

      for (band in 0 until bandCount) {
        val frequencyHz = effect.getCenterFreq(band.toShort()).toDouble() / 1000.0
        var gainDb = interpolateGain(frequencyHz, targetFrequencies)

        if (bassAmount > 0) {
          when {
            frequencyHz <= 40.0  -> gainDb += bassAmount * 0.22
            frequencyHz <= 63.0  -> gainDb += bassAmount * 0.16
            frequencyHz <= 100.0 -> gainDb += bassAmount * 0.10
            frequencyHz <= 160.0 -> gainDb += bassAmount * 0.05
          }
        }

        if (frequencyHz in 2500.0..10000.0) {
          gainDb += clarityAmount * 0.03
        }

        gainDb += preampAmount.toDouble()

        val levelMillibels = (gainDb * 100.0).toInt().coerceIn(minimum, maximum)
        effect.setBandLevel(band.toShort(), levelMillibels.toShort())
      }
      effect.enabled = sonicEnabled
    } catch (e: Exception) {
      equalizerError = e.message ?: "applyEqualizer failed"
    }
  }

  private fun applyPreamp() {
    val effect = loudnessEnhancer ?: return
    try {
      val totalGainMb = (preampAmount * 100)
      val finalGain = totalGainMb.coerceIn(-1200, 1500)
      effect.setTargetGain(finalGain)
      effect.enabled = sonicEnabled && preampAmount != 0
    } catch (e: Exception) {
      preampError = e.message ?: "LoudnessEnhancer failed"
    }
  }

  private fun applySpatial() {
    val effect = virtualizer ?: return
    try {
      if (effect.strengthSupported) {
        val strength = (spatialAmount * 10).coerceIn(0, 1000).toShort()
        effect.setStrength(strength)
      }
      effect.enabled = sonicEnabled && spatialAmount > 0
    } catch (e: Exception) {
      spatialError = e.message ?: "Virtualizer failed"
    }
  }

  private fun interpolateGain(frequencyHz: Double, frequencies: DoubleArray): Double {
    if (frequencyHz <= frequencies.first()) return eqLevelsDb.first()
    if (frequencyHz >= frequencies.last()) return eqLevelsDb.last()
    for (index in 0 until frequencies.lastIndex) {
      val lower = frequencies[index]
      val upper = frequencies[index + 1]
      if (frequencyHz <= upper) {
        val ratio = (ln(frequencyHz) - ln(lower)) / (ln(upper) - ln(lower))
        return eqLevelsDb[index] + (eqLevelsDb[index + 1] - eqLevelsDb[index]) * ratio
      }
    }
    return 0.0
  }

  private fun capabilities(): Map<String, Any> {
    val eqBands = try { equalizer?.numberOfBands?.toInt() ?: 0 } catch (e: Exception) { 0 }
    val range = try { equalizer?.bandLevelRange } catch (e: Exception) { null }
    return mapOf(
      "attached" to (sessionId > 0 && equalizer != null),
      "sessionId" to sessionId,
      "enabled" to sonicEnabled,
      "equalizerAvailable" to (eqBands > 0),
      "bassBoostAvailable" to (eqBands > 0), 
      "bassBoostStrengthSupported" to true,
      "spatialAvailable" to (virtualizer != null),
      "spatialStrengthSupported" to (virtualizer?.strengthSupported == true),
      "equalizerBands" to eqBands,
      "equalizerMinDb" to ((range?.getOrNull(0)?.toInt() ?: 0) / 100.0),
      "equalizerMaxDb" to ((range?.getOrNull(1)?.toInt() ?: 0) / 100.0),
      "equalizerError" to equalizerError,
      "bassBoostError" to "",
      "spatialError" to spatialError,
      "bassBoostFallback" to false,
      "diagnostics" to "$lastDiagnostics | eqErr=$equalizerError | spErr=$spatialError | preErr=$preampError"
    )
  }

  private fun releaseEffects() {
    try { equalizer?.enabled = false; equalizer?.release() } catch (_: Exception) {}
    try { virtualizer?.enabled = false; virtualizer?.release() } catch (_: Exception) {}
    try { loudnessEnhancer?.enabled = false; loudnessEnhancer?.release() } catch (_: Exception) {}
    equalizer = null; virtualizer = null; loudnessEnhancer = null
  }

  private fun findPlayerSessionId(): Int {
    return try {
      val holder = listOf("ExpoAudio", "AudioModule", "Audio").firstNotNullOfOrNull {
        appContext.registry.getModuleHolder(it)
      }
      if (holder == null) return 0
      searchSessionId(holder.module, 0, IdentityHashMap())
    } catch (error: Throwable) { 0 }
  }

  private fun searchSessionId(target: Any?, depth: Int, visited: IdentityHashMap<Any, Boolean>): Int {
    if (target == null || depth > 8) return 0
    if (visited.put(target, true) != null) return 0
    val className = target.javaClass.name
    if (className.contains("ExoPlayer") || className.startsWith("androidx.media3")) {
      val id = tryReadAudioSessionId(target)
      if (id > 0) return id
    }
    when (target) {
      is Map<*, *> -> { for (v in target.values) { val id = searchSessionId(v, depth + 1, visited); if (id > 0) return id }; return 0 }
      is Collection<*> -> { for (v in target) { val id = searchSessionId(v, depth + 1, visited); if (id > 0) return id }; return 0 }
      is Lazy<*> -> return if (target.isInitialized()) searchSessionId(target.value, depth + 1, visited) else 0
      is java.lang.ref.Reference<*> -> return searchSessionId(target.get(), depth + 1, visited)
      is java.util.concurrent.atomic.AtomicReference<*> -> return searchSessionId(target.get(), depth + 1, visited)
    }
    val isLikelyHolder = className.startsWith("expo.modules.audio") || className.startsWith("expo.modules.kotlin") || className.startsWith("com.facebook.react") || className.contains("Player") || className.contains("Audio")
    if (depth > 0 && !isLikelyHolder) return 0
    var type: Class<*>? = target.javaClass
    while (type != null && type != Any::class.java) {
      for (field in type.declaredFields) {
        try { field.isAccessible = true; val value = field.get(target); if (value != null) { val id = searchSessionId(value, depth + 1, visited); if (id > 0) return id } } catch (_: Throwable) {}
      }
      type = type.superclass
    }
    return 0
  }

  private fun tryReadAudioSessionId(target: Any): Int {
    return try {
      for (name in listOf("getAudioSessionId", "getAudioSessionID")) {
        val m = target.javaClass.methods.firstOrNull { it.name == name && it.parameterCount == 0 }
        if (m != null) { val v = m.invoke(target); if (v is Int && v > 0) return v }
      }
      for (fieldName in listOf("audioSessionId", "mAudioSessionId", "sessionId")) {
        try { val f = target.javaClass.getDeclaredField(fieldName); f.isAccessible = true; val v = f.get(target); if (v is Int && v > 0) return v } catch (_: Throwable) {}
      }
      0
    } catch (_: Throwable) { 0 }
  }

  companion object { private const val TAG = "SonicAudio" }
}