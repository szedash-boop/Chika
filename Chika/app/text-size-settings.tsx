import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function TextSizeSettingsScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();   // ← Add this
  const { colors, textSize, setTextSize } = useTheme();
  const [previewSize, setPreviewSize] = useState(textSize);

  const handleSave = async () => {
    setTextSize(previewSize);
    await AsyncStorage.setItem('textSize', previewSize.toString());
    router.back();
  };

  const sizeLabels = ['Small', 'Normal', 'Large', 'Extra Large'];
  const sizeValues = [0.85, 1, 1.15, 1.3];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Text Size</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Preview */}
        <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview</Text>
          <Text style={[styles.previewTitle, { color: colors.text, fontSize: 18 * previewSize }]}>
            Thread Title Example
          </Text>
          <Text style={[styles.previewBody, { color: colors.text, fontSize: 14 * previewSize }]}>
            This is how the text will look in threads and comments. Adjust the slider below to find the size that works best for you.
          </Text>
        </View>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            {Math.round(previewSize * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.7}
            maximumValue={1.5}
            value={previewSize}
            onValueChange={setPreviewSize}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>

        {/* Quick preset buttons */}
        <View style={styles.presetsContainer}>
          {sizeValues.map((value, index) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.presetButton,
                { 
                  backgroundColor: previewSize === value ? colors.primary : colors.card,
                  borderColor: colors.border 
                }
              ]}
              onPress={() => setPreviewSize(value)}
            >
              <Text style={[
                styles.presetText,
                { color: previewSize === value ? 'white' : colors.text }
              ]}>
                {sizeLabels[index]}
              </Text>
            </TouchableOpacity>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewBody: {
    lineHeight: 20,
  },
  sliderContainer: {
    marginBottom: 32,
  },
  sliderLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  presetsContainer: {
    gap: 12,
  },
  presetButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
  },
});