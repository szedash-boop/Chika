import * as SecureStore from 'expo-secure-store';

const EMAIL_KEY = 'user_email';
const PASSWORD_KEY = 'user_password';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const saveCredentials = async (email: string, password: string) => {
  try {
    await SecureStore.setItemAsync(EMAIL_KEY, email);
    await SecureStore.setItemAsync(PASSWORD_KEY, password);
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
};

export const getCredentials = async () => {
  try {
    const email = await SecureStore.getItemAsync(EMAIL_KEY);
    const password = await SecureStore.getItemAsync(PASSWORD_KEY);
    return { email, password };
  } catch (error) {
    console.error('Error getting credentials:', error);
    return { email: null, password: null };
  }
};

export const clearCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    await SecureStore.deleteItemAsync(PASSWORD_KEY);
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
};

export const setBiometricEnabled = async (enabled: boolean) => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error setting biometric preference:', error);
  }
};

export const isBiometricEnabled = async () => {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting biometric preference:', error);
    return false;
  }
};