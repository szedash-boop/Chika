import DrawerContent from '@/components/DrawerContent';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ImageBackground, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { registerForPushNotificationsAsync } from '../../pushNotifications';
import { getRelativeTime } from '../../utils/timeUtils';
import { getBlockedUsernames, getFilteredKeywords } from '../../utils/userUtils';

interface Thread {
  id: string;
  title: string;
  author: string;
  category: string;
  content: string;
  likes: number;
  dislikes?: number;
  replies: number;
  createdAt?: Timestamp;
  timestamp: string;
}
export default function HomeScreen() {
  const router = useRouter();
  const { colors, backgroundImage, textSize } = useTheme();
  console.log('Background image:', backgroundImage);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'general' | 'hot'>('general');
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set());
  

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // Both tabs load ALL threads (no category filter)
    const q = query(collection(db, 'threads'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: getRelativeTime(doc.data().createdAt),
      } as Thread));

      // Filter out blocked users
      threadsData = threadsData.filter(thread => !blockedUsernames.includes(thread.author));

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

      // Sort based on active tab
      if (activeTab === 'general') {
        threadsData.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt.seconds - a.createdAt.seconds;
        });
      } else {
        // Hot: sort by likes (highest first)
        threadsData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }

      setThreads(threadsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshKey, activeTab, blockedUsernames, filteredKeywords]);
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
    const authenticateUser = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
          console.log('User signed in anonymously');
        }
        
        // Register for push notifications and store token
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && auth.currentUser) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            pushToken: pushToken,
            createdAt: new Date(),
          }, { merge: true });
          console.log('Push token saved:', pushToken);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };

    authenticateUser();
  }, []);
  
  const renderThread = ({ item, index }: any) => {
  const showAd = (index + 1) % 15 === 0;
  
  return (
    
    <>
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
        <Text style={[styles.title, { color: colors.text, fontSize: 16 * textSize }]}>{item.title}</Text>
        
        {item.imageUrl && (
          <TouchableOpacity onPress={() => setRevealedImages(prev => new Set(prev).add(item.id))}>
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
          <Text style={[styles.author, { color: colors.textSecondary, fontSize: 12 * textSize }]}>{item.author}</Text>
          <View style={styles.stats}>
            <View style={styles.statWithIcon}>
              <Ionicons name="thumbs-up-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.likes || 0}</Text>
            </View>
            <View style={styles.statWithIcon}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary, fontSize: 12 * textSize }]}>{item.likes || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
};

  return (

    <ImageBackground 
    source={backgroundImage ? { uri: backgroundImage } : undefined}
    style={[styles.container, { backgroundColor: colors.background }]}
    imageStyle={{ opacity: 0.3 }}
  >
      <View style={styles.header}>
        {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'general' && styles.activeTab]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
            Chika
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'hot' && styles.activeTab]}
          onPress={() => setActiveTab('hot')}
        >
          <Text style={[styles.tabText, activeTab === 'hot' && styles.activeTabText]}>
            Hot
          </Text>
        </TouchableOpacity>
      </View>
      
      {threads.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No threads yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Be the first to share something!</Text>
          <TouchableOpacity 
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/create-post?category=Chika')}
          >
            <Text style={styles.emptyButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={threads}
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
        <TouchableOpacity style={styles.bottomBarButton} activeOpacity={0.7} onPress={() => router.push(`/create-post?category=Chika`)}>
          <Ionicons name="add-outline" size={24} color="white" />
          <Text style={styles.bottomBarLabel}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarButton} activeOpacity={0.7} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={24} color="white" />
          <Text style={styles.bottomBarLabel}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBarButton}
          activeOpacity={0.7}
          onPress={() => router.push('/search')}
        >
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
    </ImageBackground>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4D0C0C',
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FFC107',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    width: '80%',
    backgroundColor: '#1a1a1a',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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