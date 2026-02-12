import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';
import { getRelativeTime } from '../utils/timeUtils';
import { getBlockedUsernames, getFilteredKeywords } from '../utils/userUtils';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [favoriteThreads, setFavoriteThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);

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
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    // Load user's favorites
    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const favoriteIds = snapshot.docs.map(doc => doc.data().threadId);
      
      // Load full thread data for each favorite
      const threadsPromises = favoriteIds.map(async (threadId) => {
        const threadDoc = await getDoc(doc(db, 'threads', threadId));
        if (threadDoc.exists()) {
          return {
            id: threadDoc.id,
            ...threadDoc.data(),
            timestamp: getRelativeTime(threadDoc.data().createdAt),
          };
        }
        return null;
      });

      const threads = (await Promise.all(threadsPromises)).filter(t => t !== null);
      
      // Filter out blocked users
      const filteredBlockedThreads = threads.filter((thread: any) => !blockedUsernames.includes(thread.author));

      // Filter out threads containing filtered keywords
      let finalFilteredThreads = filteredBlockedThreads;
      if (filteredKeywords.length > 0) {
        finalFilteredThreads = filteredBlockedThreads.filter((thread: any) => {
          const title = thread.title?.toLowerCase() || '';
          const content = thread.content?.toLowerCase() || '';
          return !filteredKeywords.some(keyword => 
            title.includes(keyword) || content.includes(keyword)
          );
        });
      }
      
      setFavoriteThreads(finalFilteredThreads);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [blockedUsernames, filteredKeywords]);

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
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.threadImage}
        />
      )}
      <View style={styles.threadFooter}>
        <Text style={[styles.author, { color: colors.textSecondary }]}>{item.author}</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="thumbs-up-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}> {item.likes || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}> {item.replies || 0}</Text>
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
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
          <Ionicons name="star-outline" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No favorites yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Tap the ⭐ on threads to save them here
          </Text>
        </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.placeholder} />
      </View>

      {favoriteThreads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No favorites yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Tap the star icon on any thread to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteThreads}
          renderItem={renderThread}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
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
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  threadCard: {
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  threadImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
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
});