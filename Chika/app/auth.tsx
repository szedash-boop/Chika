import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebaseConfig';
import { getCredentials, saveCredentials } from '../utils/secureStorage';

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (compatible && enrolled) {
      setBiometricAvailable(true);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    }
  };
  const handleBrowseAsGuest = () => {
    // Navigate to main app without authentication
    router.replace('/(tabs)');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Save credentials for biometric login
      await saveCredentials(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Save credentials for biometric login
      await saveCredentials(email, password);
      router.replace('/user-setup?showTutorial=true');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleBiometricLogin = async () => {
    const credentials = await getCredentials();
    
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'No saved credentials. Please log in with email/password first.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to login',
      fallbackLabel: 'Use password',
    });

    if (result.success) {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        router.replace('/(tabs)');
      } catch (error: any) {
        Alert.alert('Login Failed', error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Welcome Screen
  if (mode === 'welcome') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.welcomeContent}>
          <Text style={[styles.logo, { color: colors.primary }]}>Chika</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your anonymous forum community
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setMode('signup')}
            >
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleBrowseAsGuest}
            >
              <Text style={[styles.guestButtonText, { color: colors.textSecondary }]}>
                Browse as Guest
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Login/Signup Screen
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.authContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMode('welcome')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.authTitle, { color: colors.text }]}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
              />
            </View>
          )}
          {mode === 'signup' && (
            <View style={styles.termsContainer}>
              <View style={styles.checkbox}>
                <TouchableOpacity 
                  onPress={() => {
                    if (!hasReadTerms) {
                      Alert.alert('Please Read Terms', 'You must read the Privacy Policy and Terms of Service before accepting.');
                      return;
                    }
                    setTermsAccepted(!termsAccepted);
                  }}
                >
                  <View style={[styles.checkboxBox, { borderColor: colors.border }]}>
                    {termsAccepted && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    I agree to the{' '}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setHasReadTerms(true);
                    router.push('/legal/terms-review?type=terms');
                  }}>
                    <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
                      Terms of Service
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    {' '}and{' '}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setHasReadTerms(true);
                    router.push('/legal/terms-review?type=privacy');
                  }}>
                    <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
                      Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton, 
              { backgroundColor: colors.primary },
              mode === 'signup' && !termsAccepted && styles.submitButtonDisabled
            ]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading || (mode === 'signup' && !termsAccepted)}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'login' ? 'Log In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            <Text style={[styles.switchModeText, { color: colors.textSecondary }]}>
              {mode === 'login' 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>
          {mode === 'login' && biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
            >
              <Ionicons name="finger-print" size={32} color={colors.primary} />
              <Text style={[styles.biometricText, { color: colors.textSecondary }]}>
                Login with {biometricType}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 64,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 16,
  },
  authContent: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchModeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
  },
  biometricButton: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 16,
  },
  biometricText: {
    fontSize: 14,
  },
  termsContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});