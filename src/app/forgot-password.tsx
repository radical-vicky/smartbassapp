import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { InputField } from '../components/InputField';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.EXPO_PUBLIC_APP_SCHEME}://reset-password`,
});
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setIsSent(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={15} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we will send you a link to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <InputField label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <Pressable onPress={handleReset} disabled={loading || isSent} style={styles.primaryBtn}>
          <LinearGradient colors={['#FF8500', '#FF9A28']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{isSent ? 'Link Sent' : 'Send Reset Link'}</Text>}
          </LinearGradient>
        </Pressable>

        {isSent && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8500" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successSub}>Confirmation status shown after sending</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08090B', paddingHorizontal: 24, paddingTop: 60 },
  header: { marginBottom: 30 },
  backBtn: { marginBottom: 20 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  subtitle: { color: '#A0A0A0', fontSize: 14, lineHeight: 22 },
  form: { width: '100%' },
  primaryBtn: { width: '100%', height: 54, borderRadius: 10, overflow: 'hidden', marginBottom: 24, marginTop: 10 },
  btnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  successBox: { flexDirection: 'row', backgroundColor: '#121212', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center' },
  successTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  successSub: { color: '#A0A0A0', fontSize: 12 },
});