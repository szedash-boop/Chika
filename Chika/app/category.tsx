import DrawerContent from '@/components/DrawerContent';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebaseConfig';
import { getRelativeTime } from '../utils/timeUtils';
import { getBlockedUsernames, getFilteredKeywords } from '../utils/userUtils';

interface Thread {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  author?: string;
  userId?: string;
  imageUrl?: string;
  likes?: number;
  dislikes?: number;
  replies?: number;
  createdAt?: any;
  timestamp?: string;
}

export default function CategoryScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<any>(null);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleSearchToggle = useCallback(() => {
    setSearchVisible(prev => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);
  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    const blocked = await getBlockedUsernames();
    setBlockedUsernames(blocked);
  };
  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
      const keywords = await getFilteredKeywords();
      setFilteredKeywords(keywords);
  };
  useEffect(() => {
    if (!name) return;

    const q = query(
      collection(db, 'threads'), 
      where('category', '==', name),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let threadsData: Thread[] = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
  timestamp: getRelativeTime(doc.data().createdAt),
} as Thread));

      // Filter out blocked users
      threadsData = threadsData.filter(thread => !blockedUsernames.includes((thread as any).author));

      // Filter out threads containing filtered keywords
      if (filteredKeywords.length > 0) {
        threadsData = threadsData.filter(thread => {
          const title = thread.title?.toLowerCase() || '';
          const content = thread.content?.toLowerCase() || '';
          return !filteredKeywords.some(keyword => 
            title.includes(keyword) || content.includes(keyword)
          );
        });
      }
      setThreads(threadsData);
      setLoading(false);
    });

    return () => unsubscribe();
   }, [name, refreshKey, blockedUsernames, filteredKeywords]);

  const renderThread = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.threadCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/thread?id=${item.id}`)}
    >
      <View style={styles.threadHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{item.timestamp}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      {item.imageUrl && (
  <TouchableOpacity 
    onPress={() => setRevealedImages(prev => new Set(prev).add(item.id))}
  >
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.threadImage}
      blurRadius={revealedImages.has(item.id) ? 0 : 20}
    />
    {!revealedImages.has(item.id) && (
      <View style={styles.blurOverlay}>
        <Ionicons name="eye-outline" size={30} color="white" />
      </View>
    )}
  </TouchableOpacity>
)}
      <View style={styles.threadFooter}>
        <Text style={[styles.author, { color: colors.textSecondary }]}>{item.author}</Text>
        <View style={styles.stats}>
          <View style={styles.statWithIcon}>
            <Ionicons name="thumbs-up-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.likes || 0}</Text>
          </View>
          <View style={styles.statWithIcon}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.replies || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={styles.placeholder} />
      </View>

      {searchVisible && (
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Search threads..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearch}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.clearSearchText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {threads.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="folder-open-outline" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No threads yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Be the first to post in {name}!</Text>
        </View>
      ) : (
        <FlatList
          data={threads.filter(thread =>
            !searchQuery.trim() ||
            thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            thread.author?.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderThread}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 70 }}
        />
      )}

      <View style={[styles.bottomBar, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.bottomBarButton} activeOpacity={0.7} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu-outline" size={24} color="white" />
          <Text style={styles.bottomBarLabel}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarButton} activeOpacity={0.7} onPress={() => router.push(`/create-post?category=${name}`)}>
          <Ionicons name="add-outline" size={24} color="white" />
          <Text style={styles.bottomBarLabel}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarButton} activeOpacity={0.7} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={24} color="white" />
          <Text style={styles.bottomBarLabel}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarButton} activeOpacity={0.7} onPress={handleSearchToggle}>
          <Ionicons name="search-outline" size={24} color="white" />
          <Text style={styles.bottomBarLabel}>Search</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={drawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.drawerContainer, { backgroundColor: colors.card }]}>
            <DrawerContent onClose={() => setDrawerVisible(false)} />
          </View>
          <TouchableOpacity
            style={styles.modalDismiss}
            onPress={() => setDrawerVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  threadCard: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  bottomBarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomBarIcon: {
    fontSize: 28,
    color: 'white',
  },
  bottomBarLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  searchContainer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  clearSearch: {
    marginLeft: 8,
    padding: 8,
  },
  clearSearchText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    width: '80%',
  },
  modalDismiss: {
    flex: 1,
  },
  threadImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 138, 128, 0.2)',
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FF8A80',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
});