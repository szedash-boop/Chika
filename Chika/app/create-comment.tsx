import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import GifPicker from '../components/GifPicker';
import StickerPicker from '../components/StickerPicker';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db, storage } from '../firebaseConfig';
import { sendPushNotification } from '../sendNotification';
import { convertToWebP } from '../utils/imageUtils';
import { getCurrentUsername, isGuestUser } from '../utils/userUtils';


export default function CreateCommentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { threadId, parentCommentId, parentAuthor, threadTitle } = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gifPickerVisible, setGifPickerVisible] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const [stickerPickerVisible, setStickerPickerVisible] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [customStickers, setCustomStickers] = useState<string[]>([]);

  const canPost = content.trim().length > 0 || imageUri !== null || selectedGifUrl !== null || selectedSticker !== null;

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `comments/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const uploadCustomSticker = async (stickerUri: string) => {
    try {
      const response = await fetch(stickerUri);
      const blob = await response.blob();
      const filename = `stickers/${auth.currentUser?.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setCustomStickers(prev => [...prev, downloadURL]);
      setSelectedSticker(downloadURL);
    } catch (error) {
      console.error('Error uploading custom sticker:', error);
      Alert.alert('Error', 'Failed to upload sticker');
    }
  };

  const handlePost = async () => {
    if (content.trim() === '' && !imageUri && !selectedGifUrl && !selectedSticker) {
      Alert.alert('Error', 'Please add text, image, GIF, or sticker');
      return;
    }

    // Check if user is guest
    if (isGuestUser()) {
      Alert.alert(
        'Sign In Required',
        'You must create an account to comment. Guests can only browse and vote.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    setUploading(true);

    try {
      let imageUrl = '';

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `comments/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Get real username
      const username = await getCurrentUsername();

      await addDoc(collection(db, 'comments'), {
        threadId,
        parentCommentId: parentCommentId || null,
        author: username,
        userId: auth.currentUser?.uid || '',
        content: content.trim(),
        imageUrl: imageUrl,
        gifUrl: selectedGifUrl || '',
        stickerUrl: selectedSticker || '',
        likes: 0,
        dislikes: 0,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'threads', threadId as string), {
        replies: increment(1),
      });

      // Send push notification to thread author
      try {
        const threadDoc = await getDoc(doc(db, 'threads', threadId as string));
        if (threadDoc.exists()) {
          const threadAuthorId = threadDoc.data().userId;
          
          // Don't notify yourself
          if (threadAuthorId && threadAuthorId !== auth.currentUser?.uid) {
            const authorDoc = await getDoc(doc(db, 'users', threadAuthorId));
            if (authorDoc.exists() && authorDoc.data().pushToken) {
              const notifSettings = authorDoc.data().notificationSettings || {};
              // Check if user has post reply notifications enabled (default true)
              if (notifSettings.postReplies !== false) {
                await sendPushNotification(
                  authorDoc.data().pushToken,
                  'New Reply',
                  `${username} replied to your post: "${threadTitle}"`
                );
              }
            }
          }
        }

        // If replying to a comment, notify the comment author too
        if (parentCommentId) {
          const parentCommentDoc = await getDoc(doc(db, 'comments', parentCommentId as string));
          if (parentCommentDoc.exists()) {
            const commentAuthorId = parentCommentDoc.data().userId;
            
            if (commentAuthorId && commentAuthorId !== auth.currentUser?.uid) {
              const commentAuthorDoc = await getDoc(doc(db, 'users', commentAuthorId));
              if (commentAuthorDoc.exists() && commentAuthorDoc.data().pushToken) {
                const notifSettings = commentAuthorDoc.data().notificationSettings || {};
                // Check if user has comment reply notifications enabled (default true)
                if (notifSettings.commentReplies !== false) {
                  await sendPushNotification(
                    commentAuthorDoc.data().pushToken,
                    'New Reply',
                    `${username} replied to your comment`
                  );
                }
              }
            }
          }
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the comment if notification fails
      }

      Alert.alert('Success', 'Comment posted!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setUploading(false);
    }
  };
  const showImageOptions = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
  const webpUri = await convertToWebP(result.assets[0].uri);
  setImageUri(webpUri);
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
  const webpUri = await convertToWebP(result.assets[0].uri);
  setImageUri(webpUri);
}
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {parentAuthor ? `Reply to ${parentAuthor}` : 'New Comment'}
        </Text>
        <TouchableOpacity
          style={[styles.headerButton, !canPost && styles.headerButtonDisabled]}
          onPress={handlePost}
          disabled={uploading || !canPost}
        >
          {uploading ? (
            <Text style={styles.headerButtonText}>...</Text>
          ) : (
            <Ionicons name="send-outline" size={20} color={canPost ? 'white' : 'rgba(255,255,255,0.4)'} />
          )}
        </TouchableOpacity>
      </View>

      {/* Context bar */}
      {threadTitle ? (
        <View style={[styles.contextBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.contextText, { color: colors.textSecondary }]} numberOfLines={1}>
            {threadTitle}
          </Text>
        </View>
      ) : null}

      {/* Body */}
      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <View style={[styles.titleContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{title.length}/100</Text>
        </View>

        <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.contentInput, { color: colors.text }]}
            placeholder="Write your comment..."
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
        {selectedGifUrl && (
          <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
            <Image source={{ uri: selectedGifUrl }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedGifUrl(null)}>
              <Text style={styles.removeMediaText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {selectedSticker && (
          <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
            {selectedSticker.startsWith('http') ? (
              <Image source={{ uri: selectedSticker }} style={styles.previewImage} />
            ) : (
              <Text style={styles.emojiSticker}>{selectedSticker}</Text>
            )}
            <TouchableOpacity style={styles.removeMedia} onPress={() => setSelectedSticker(null)}>
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
        onSelectGif={(gifUrl) => setSelectedGifUrl(gifUrl)}
      />
      <StickerPicker
        visible={stickerPickerVisible}
        onClose={() => setStickerPickerVisible(false)}
        onSelectSticker={(sticker) => setSelectedSticker(sticker)}
        onUploadCustomSticker={uploadCustomSticker}
        customStickers={customStickers}
      />
    </KeyboardAvoidingView>
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
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contextText: {
    fontSize: 13,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 200,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 160,
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
