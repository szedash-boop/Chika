import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: string) => void;
  onUploadCustomSticker: (imageUri: string) => void;
  customStickers: string[]; // Array of custom sticker image URLs
}

export default function StickerPicker({ visible, onClose, onSelectSticker, onUploadCustomSticker, customStickers }: StickerPickerProps) {
  const stickers = [
    // Emotions
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠',
    '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
    '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
    '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
    
    // Gestures
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐',
    '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
    '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
    
    // Hearts & Symbols
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️',
    '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
    
    // Animals
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
    
    // Food
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆',
    '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄',
    '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨',
    '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩',
    '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙',
    
    // Activities
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
    '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷',
  ];
const pickCustomSticker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Permission needed to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      onUploadCustomSticker(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose a Sticker</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Custom Stickers Section */}
          {customStickers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Stickers</Text>
              <View style={styles.stickerGrid}>
                {customStickers.map((stickerUrl, index) => (
                  <TouchableOpacity
                    key={`custom-${index}`}
                    style={styles.customStickerItem}
                    onPress={() => {
                      onSelectSticker(stickerUrl);
                      onClose();
                    }}
                  >
                    <Image source={{ uri: stickerUrl }} style={styles.customStickerImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Upload Custom Sticker Button */}
          <TouchableOpacity style={styles.uploadButton} onPress={pickCustomSticker}>
            <Text style={styles.uploadButtonText}>➕ Upload Custom Sticker</Text>
          </TouchableOpacity>

          {/* Emoji Stickers Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emoji Stickers</Text>
            <View style={styles.stickerGrid}>
              {stickers.map((sticker, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.stickerItem}
                  onPress={() => {
                    onSelectSticker(sticker);
                    onClose();
                  }}
                >
                  <Text style={styles.stickerText}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#4D0C0C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    fontSize: 28,
    color: 'white',
    fontWeight: '300',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  stickerItem: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  stickerText: {
    fontSize: 32,
  },
  content: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  uploadButton: {
    backgroundColor: '#4D0C0C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    marginHorizontal: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customStickerItem: {
    width: '12.5%',
    aspectRatio: 1,
    padding: 4,
  },
  customStickerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});