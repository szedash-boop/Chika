import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
  ActivityIndicator,
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
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, storage } from '../firebaseConfig';
import { convertToWebP } from '../utils/imageUtils';
import { getCurrentUsername, isGuestUser } from '../utils/userUtils';

const CATEGORIES = [
  'Chika',
  'Maroon School',
  'Green School', 
  'Blue School',
  'Yellow School',
  'School',
  'Love and Dating',
  'Work',
  'Politics',
  'Money & Hustle',
  'Rant',
  'Neighbourhood',
  'Confessions'
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { category: initialCategory } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(initialCategory as string || 'Chika');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const canPost = title.trim().length > 0 || content.trim().length > 0 || imageUri !== null;

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert('Error', 'Please add a title, content, or image');
      return;
    }

    // Check if user is guest
    if (isGuestUser()) {
      Alert.alert(
        'Sign In Required',
        'You must create an account to post threads. Guests can only browse and vote.',
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
        imageUrl = await uploadImage(imageUri);
      }

      // Get real username
      const username = await getCurrentUsername();

      await addDoc(collection(db, 'threads'), {
        title: title.trim(),
        category: category,
        author: username,
        userId: auth.currentUser?.uid || '',
        content: content.trim(),
        imageUrl: imageUrl,
        likes: 0,
        dislikes: 0,
        replies: 0,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your post has been created!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
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
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
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

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryDropdown}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={styles.categoryDropdownText}>{category} ▾</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setPreviewVisible(true)}>
            <Ionicons name="eye-outline" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, !canPost && styles.headerButtonDisabled]}
            onPress={handlePost}
            disabled={uploading || !canPost}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send-outline" size={20} color={canPost ? 'white' : 'rgba(255,255,255,0.4)'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <View style={[styles.titleContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{title.length}/200</Text>
        </View>

        <View style={[styles.contentContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.contentInput, { color: colors.text }]}
            placeholder="type content"
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={5000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{content.length}/5000</Text>
        </View>

        {/* Media Preview */}
        {imageUri && (
          <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removeMediaText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.6} onPress={showImageOptions}>
          <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.6} onPress={() => Alert.alert('Coming Soon', 'Link insertion coming soon')}>
          <Ionicons name="link-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.6} onPress={() => Alert.alert('Coming Soon', 'Formatting coming soon')}>
          <Text style={[styles.toolbarTextIcon, { color: colors.textSecondary }]}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.6} onPress={() => Alert.alert('Coming Soon', 'Formatting coming soon')}>
          <Text style={[styles.toolbarTextIcon, { color: colors.textSecondary, fontStyle: 'italic' }]}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.6} onPress={() => Alert.alert('Coming Soon', 'Formatting coming soon')}>
          <Text style={[styles.toolbarTextIcon, styles.toolbarUnderline, { color: colors.textSecondary }]}>U</Text>
        </TouchableOpacity>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={[styles.categoryModal, { backgroundColor: colors.card }]}>
            <View style={[styles.categoryModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.categoryModalTitle, { color: colors.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Text style={[styles.categoryModalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    { borderBottomColor: colors.border },
                    cat === category && { backgroundColor: 'rgba(255,255,255,0.1)' },
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.categoryItemText,
                    { color: colors.text },
                  ]}>{cat}</Text>
                  {cat === category && (
                    <Ionicons name="checkmark" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={previewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <View style={[styles.previewModal, { backgroundColor: colors.background }]}>
            <View style={[styles.previewHeader, { backgroundColor: colors.primary }]}>
              <Text style={styles.previewHeaderTitle}>Preview</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Text style={styles.previewCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.previewBody}>
              <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
                <View style={styles.previewPostHeader}>
                  <Text style={[styles.previewCategory, { color: colors.primary }]}>{category}</Text>
                  <Text style={[styles.previewTimestamp, { color: colors.textSecondary }]}>Just now</Text>
                </View>
                <Text style={[styles.previewTitle, { color: colors.text }]}>
                  {title || '(No title)'}
                </Text>
                {content ? (
                  <Text style={[styles.previewContent, { color: colors.text }]}>{content}</Text>
                ) : null}
                {imageUri && (
                  <Image source={{ uri: imageUri }} style={styles.previewPostImage} />
                )}
                <View style={styles.previewFooter}>
                  <Text style={[styles.previewAuthor, { color: colors.textSecondary }]}>Anonymous</Text>
                  <View style={styles.previewStats}>
                    <View style={styles.previewStatWithIcon}>
                      <Ionicons name="thumbs-up-outline" size={12} color={colors.textSecondary} />
                      <Text style={[styles.previewStatText, { color: colors.textSecondary }]}>0</Text>
                    </View>
                    <View style={styles.previewStatWithIcon}>
                      <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
                      <Text style={[styles.previewStatText, { color: colors.textSecondary }]}>0</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
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
  headerIcon: {
    fontSize: 22,
    color: 'white',
  },
  headerIconDisabled: {
    opacity: 0.4,
  },
  categoryDropdown: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryDropdownText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Body
  body: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleInput: {
    fontSize: 18,
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

  // Media Preview
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
  removeMediaButton: {
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

  // Bottom Toolbar
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
  toolbarIcon: {
    fontSize: 22,
  },
  toolbarTextIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  toolbarUnderline: {
    textDecorationLine: 'underline',
  },

  // Category Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  categoryModal: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryModalClose: {
    fontSize: 22,
  },
  categoryList: {
    paddingBottom: 40,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryItemText: {
    fontSize: 16,
  },

  // Preview Modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewModal: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  previewHeaderTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  previewCloseButton: {
    color: 'white',
    fontSize: 22,
  },
  previewBody: {
    flex: 1,
    padding: 8,
  },
  previewCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewTimestamp: {
    fontSize: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  previewPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewAuthor: {
    fontSize: 12,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 12,
  },
  previewStatWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewStatText: {
    fontSize: 12,
  },
});
