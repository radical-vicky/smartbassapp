import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/onboarding');
    }, 2500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.content}>
        {/* Logo Image */}
        <Image
          source={require('../../assets/images/radev-sonic-logo.png')} // Update this to your actual cut-out logo
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* App Name Text */}
        <Text style={styles.title}>RADEV</Text>
        <Text style={styles.subtitle}>SONIC</Text>
      </View>

      {/* Bottom Tagline */}
      <View style={styles.bottomContainer}>
        <Text style={styles.tagline}>Play with Power. Feel the Music.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08090B', // Deep black background
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Pushes the content to the center
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF7A00', // Orange accent
    letterSpacing: 8, // Spreads out the letters
    marginLeft: 8, // Offsets the letter spacing to keep it centered
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50, // Adjust based on safe area
    alignItems: 'center',
  },
  tagline: {
    color: '#A0A0A0', // Muted gray
    fontSize: 12,
    fontWeight: '400',
  }
});