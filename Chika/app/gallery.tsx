import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebaseConfig';

const { width } = Dimensions.get('window');
const imageSize = (width - 24) / 2;

export default function GalleryScreen() {
  const { threadId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [images, setImages] = useState<{ url: string; source: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      if (!threadId) return;

      const allImages: { url: string; source: string }[] = [];

      // Load thread image
      const threadDoc = await getDoc(doc(db, 'threads', threadId as string));
      if (threadDoc.exists()) {
        const data = threadDoc.data();
        if (data.imageUrl) {
          allImages.push({ url: data.imageUrl, source: 'Original Post' });
        }
      }

      // Load comment images
      const q = query(collection(db, 'comments'), where('threadId', '==', threadId));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.imageUrl) {
          allImages.push({ url: data.imageUrl, source: data.author });
        }
        if (data.gifUrl) {
          allImages.push({ url: data.gifUrl, source: `${data.author} (GIF)` });
        }
      });

      setImages(allImages);
      setLoading(false);
    };

    loadImages();
  }, [threadId]);

  const renderImage = ({ item }: any) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => setSelectedImage(item.url)}
    >
      <Image source={{ uri: item.url }} style={styles.gridImage} />
      <Text style={[styles.imageSource, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.source}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gallery</Text>
        <Text style={styles.headerCount}>{images.length} images</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No images in this thread</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImage}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-outline" size={32} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  grid: {
    padding: 8,
  },
  imageItem: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: imageSize,
    borderRadius: 8,
  },
  imageSource: {
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});
