import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { InputField } from '../components/InputField';
import { supabase } from '../lib/supabase'; // Ensure this path is correct

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/login');
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert(
      "Coming Soon", 
      "Google Sign-Up is currently in development. Please create an account with email."
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={15} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join RADEV SONIC today</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <InputField label="Full name" placeholder="Your name" value={fullName} onChangeText={setFullName} />
        <InputField label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <InputField label="Password" placeholder="Password" value={password} onChangeText={setPassword} isPassword />
        <InputField label="Confirm password" placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />

        <Pressable onPress={handleRegister} disabled={loading} style={[styles.primaryBtn, { marginTop: 20 }]}>
          <LinearGradient colors={['#FF8500', '#FF9A28']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Create Account</Text>}
          </LinearGradient>
        </Pressable>

        {/* Google Sign Up Button */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <Pressable style={styles.googleBtn} onPress={handleGoogleSignUp}>
          <Ionicons name="logo-google" size={20} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.googleBtnText}>Sign up with Google</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08090B', paddingHorizontal: 24, paddingTop: 60 },
  header: { marginBottom: 30 },
  backBtn: { marginBottom: 20 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#A0A0A0', fontSize: 14 },
  form: { paddingBottom: 40 },
  primaryBtn: { width: '100%', height: 54, borderRadius: 10, overflow: 'hidden', marginBottom: 24 },
  btnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { color: '#666', paddingHorizontal: 12, fontSize: 13 },
  googleBtn: { flexDirection: 'row', width: '100%', height: 54, backgroundColor: '#121212', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 30 },
  googleBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#A0A0A0', fontSize: 14 },
  footerLink: { color: '#FF8500', fontSize: 14, fontWeight: '600' },
});