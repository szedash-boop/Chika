import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebaseConfig';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, theme, toggleTheme, backgroundImage, setBackgroundImage} = useTheme();
  const [showLabels, setShowLabels] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will lose access to your votes and posts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/auth');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

 

const pickBackground = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.5,
  });
  
  if (!result.canceled) {
    const uri = result.assets[0].uri;
    await AsyncStorage.setItem('backgroundImage', uri);
    setBackgroundImage(uri); // Uses context setter
    Alert.alert('Success', 'Background updated!');
  }
};

const removeBackground = async () => {
  await AsyncStorage.removeItem('backgroundImage');
  setBackgroundImage(null); // Uses context setter
  Alert.alert('Success', 'Background removed');
};
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP INFO</Text>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DISPLAY</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#FFC107' }}
              thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity 
  style={[styles.settingRow, { borderBottomColor: colors.border }]}
  onPress={() => router.push('/text-size-settings')}
>
  <Text style={[styles.settingLabel, { color: colors.text }]}>Text Size</Text>
  <Ionicons name="text-outline" size={20} color={colors.textSecondary} />
</TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={pickBackground}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>Custom Background</Text>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {backgroundImage && (
            <TouchableOpacity 
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
              onPress={removeBackground}
            >
              <Text style={[styles.settingLabel, { color: '#ff4444' }]}>Remove Background</Text>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Show Category Labels</Text>
            <Switch
              value={showLabels}
              onValueChange={setShowLabels}
              trackColor={{ false: '#767577', true: '#FFC107' }}
              thumbColor={showLabels ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Show Timestamps</Text>
            <Switch
              value={showTimestamp}
              onValueChange={setShowTimestamp}
              trackColor={{ false: '#767577', true: '#FFC107' }}
              thumbColor={showTimestamp ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Font Size</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Standard →</Text>
          </TouchableOpacity>
        </View>

        {/* Content Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTENT</Text>
          
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Long Press Thread Action</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Preview →</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => Alert.alert('Cache Cleared', 'App cache has been cleared')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>Clear Cache</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => Alert.alert('Coming Soon', 'This feature is not yet implemented')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>Clear Images & File Cache</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>0 Bytes →</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>User ID</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {auth.currentUser?.uid?.slice(0, 8) || 'Not signed in'}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Help & Support</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/legal/privacy-policy')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/legal/terms-of-service')}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>Terms of Service</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4D0C0C',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  dangerText: {
    color: '#ff4444',
  },
});