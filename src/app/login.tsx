import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { InputField } from '../components/InputField';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/home');
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      "Coming Soon", 
      "Google Sign-In is currently in development. Please use email and password for now."
    );
  };

  return (
    // KeyboardAvoidingView prevents the keyboard from pushing the layout off-screen
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      
      {/* ScrollView allows the user to scroll if the keyboard covers the inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>RADEV</Text>
            <Text style={styles.brandSubtitle}>SONIC</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.form}>
              <InputField
                label="Email or username"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              
              <InputField
                label="Password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <Pressable onPress={handleLogin} disabled={loading} style={styles.primaryBtn}>
                <LinearGradient colors={['#FF8500', '#FF9A28']} style={styles.btnGradient}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Sign In</Text>}
                </LinearGradient>
              </Pressable>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <Pressable style={styles.googleBtn} onPress={handleGoogleLogin}>
                <Ionicons name="logo-google" size={20} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to RADEV SONIC? </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Create Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08090B' },
  scrollContent: { 
    flexGrow: 1, // Ensures the content fills the screen even if it's short
    paddingHorizontal: 24, 
    paddingTop: 60,
    paddingBottom: 40 // Added padding to bottom so footer doesn't stick to the edge
  },
  header: { alignItems: 'center', marginBottom: 40 },
  brandTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: 3 },
  brandSubtitle: { color: '#FF8500', fontSize: 12, fontWeight: '700', letterSpacing: 6, marginTop: 2 },
  content: { flex: 1 }, // Pushes the footer to the bottom
  title: { color: '#FFF', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#A0A0A0', fontSize: 14, marginBottom: 30 },
  form: { width: '100%' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#FF8500', fontSize: 13, fontWeight: '600' },
  primaryBtn: { width: '100%', height: 54, borderRadius: 10, overflow: 'hidden', marginBottom: 24 },
  btnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { color: '#666', paddingHorizontal: 12, fontSize: 13 },
  googleBtn: { flexDirection: 'row', width: '100%', height: 54, backgroundColor: '#121212', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  googleBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 20 }, // Added padding top to separate from form
  footerText: { color: '#A0A0A0', fontSize: 14 },
  footerLink: { color: '#FF8500', fontSize: 14, fontWeight: '600' },
});