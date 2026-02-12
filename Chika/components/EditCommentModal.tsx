import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { db, storage } from '../firebaseConfig';
import GifPicker from './GifPicker';
import StickerPicker from './StickerPicker';

interface EditCommentModalProps {
  isVisible: boolean;
  onClose: () => void;
  comment: any; // The comment object to be edited
  threadId: string;
}

export default function EditCommentModal({ isVisible, onClose, comment, threadId }: EditCommentModalProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [existingGifUrl, setExistingGifUrl] = useState<string | null>(null);
  const [stickerUrl, setStickerUrl] = useState<string | null>(null);
  const [existingStickerUrl, setExistingStickerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gifPickerVisible, setGifPickerVisible] = useState(false);
  const [stickerPickerVisible, setStickerPickerVisible] = useState(false);
  const [customStickers, setCustomStickers] = useState<string[]>([]); // Assuming custom stickers are managed globally or fetched

  useEffect(() => {
    if (comment) {
      setContent(comment.content || '');
      setImageUri(comment.imageUrl || null);
      setExistingImageUrl(comment.imageUrl || null);
      setGifUrl(comment.gifUrl || null);
      setExistingGifUrl(comment.gifUrl || null);
      setStickerUrl(comment.stickerUrl || null);
      setExistingStickerUrl(comment.stickerUrl || null);
    }
  }, [comment]);

  const canSave = content.trim().length > 0 || imageUri !== null || gifUrl !== null || stickerUrl !== null;

  const handleUpdateComment = async () => {
    if (!canSave) {
      Alert.alert('Error', 'Please add text, image, GIF, or sticker');
      return;
    }

    setUploading(true);

    try {
      let finalImageUrl = imageUri;
      let finalGifUrl = gifUrl;
      let finalStickerUrl = stickerUrl;

      // Handle image updates
      if (existingImageUrl && imageUri !== existingImageUrl) {
        // Delete old image if it existed and is now removed/changed
        const imageRef = ref(storage, existingImageUrl);
        await deleteObject(imageRef).catch(e => console.log('Error deleting old image:', e));
      }
      if (imageUri && imageUri.startsWith('file://')) {
        // Upload new image
        finalImageUrl = await uploadMedia(imageUri, 'comments');
      }

      // Handle GIF updates (no direct upload, just URL change/removal)
      if (existingGifUrl && gifUrl === null) {
        // GIF was removed
        finalGifUrl = '';
      }

      // Handle Sticker updates (no direct upload, just URL/emoji change/removal)
      if (existingStickerUrl && stickerUrl === null) {
        // Sticker was removed
        finalStickerUrl = '';
      }

      const commentRef = doc(db, 'comments', comment.id);
      await updateDoc(commentRef, {
        content: content.trim(),
        imageUrl: finalImageUrl,
        gifUrl: finalGifUrl,
        stickerUrl: finalStickerUrl,
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Comment updated!', [{ text: 'OK', onPress: onClose }]);
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    } finally {
      setUploading(false);
    }
  };

  const uploadMedia = async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${path}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const showImageOptions = () => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Remove Photo', style: 'destructive', onPress: () => setImageUri(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setGifUrl(null); // Clear GIF if image is added
      setStickerUrl(null); // Clear sticker if image is added
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setGifUrl(null); // Clear GIF if image is added
      setStickerUrl(null); // Clear sticker if image is added
    }
  };

  const handleSelectGif = (selectedGif: string) => {
    setGifUrl(selectedGif);
    setImageUri(null); // Clear image if GIF is selected
    setStickerUrl(null); // Clear sticker if GIF is selected
    setGifPickerVisible(false);
  };

  const handleSelectSticker = (selectedSticker: string) => {
    setStickerUrl(selectedSticker);
    setImageUri(null); // Clear image if sticker is selected
    setGifUrl(null); // Clear GIF if sticker is selected
    setStickerPickerVisible(false);
  };

  const handleUploadCustomSticker = async (stickerUri: string) => {
    // Assuming custom stickers are handled globally or through specific user storage
    // For now, directly setting it. In a real app, you'd upload and get a URL.
    Alert.alert('Custom Sticker Upload', 'Custom sticker upload logic needs to be implemented and integrated with user preferences.');
    // For now, let's just set the URI directly if it's an image.
    setStickerUrl(stickerUri);
    setImageUri(null);
    setGifUrl(null);
    setStickerPickerVisible(false);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close-outline" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Comment</Text>
            <TouchableOpacity
              style={[styles.headerButton, !canSave && styles.headerButtonDisabled]}
              onPress={handleUpdateComment}
              disabled={uploading || !canSave}
            >
              {uploading ? (
                <Text style={styles.headerButtonText}>...</Text>
              ) : (
                <Ionicons name="send-outline" size={20} color={canSave ? 'white' : 'rgba(255,255,255,0.4)'} />
              )}
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.contentInput, { color: colors.text }]}
                placeholder="Edit your comment..."
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={5000}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            {/* Media Previews */}
            {imageUri && (
              <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeMedia} onPress={() => setImageUri(null)}>
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {gifUrl && (
              <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
                <Image source={{ uri: gifUrl }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeMedia} onPress={() => setGifUrl(null)}>
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {stickerUrl && (
              <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
                {stickerUrl.startsWith('http') ? (
                  <Image source={{ uri: stickerUrl }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.emojiSticker}>{stickerUrl}</Text>
                )}
                <TouchableOpacity style={styles.removeMedia} onPress={() => setStickerUrl(null)}>
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom Toolbar */}
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.toolbarButton} onPress={showImageOptions}>
              <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={() => setGifPickerVisible(true)}>
              <Ionicons name="videocam-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={() => setStickerPickerVisible(true)}>
              <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <GifPicker
            visible={gifPickerVisible}
            onClose={() => setGifPickerVisible(false)}
            onSelectGif={handleSelectGif}
          />
          <StickerPicker
            visible={stickerPickerVisible}
            onClose={() => setStickerPickerVisible(false)}
            onSelectSticker={handleSelectSticker}
            onUploadCustomSticker={handleUploadCustomSticker}
            customStickers={customStickers}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.4,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  body: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 160,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    paddingVertical: 4,
  },
  mediaPreview: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emojiSticker: {
    fontSize: 80,
    textAlign: 'center',
    padding: 20,
  },
  toolbar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingBottom: 28,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  toolbarButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
