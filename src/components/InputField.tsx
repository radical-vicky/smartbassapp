import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const InputField = ({ label, placeholder, value, onChangeText, isPassword, keyboardType = 'default' }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: '#A0A0A0', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212', // Dark input background
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
  },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  eyeIcon: { padding: 4 },
});