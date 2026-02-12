import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';
import { getRelativeTime } from '../utils/timeUtils';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [threads, setThreads] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'threads' | 'comments'>('threads');
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const categoryColor = theme === 'dark' ? '#FF8A80' : colors.primary;

  useEffect(() => {
    checkIfFollowing();
  }, [username]);

  const checkIfFollowing = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !username) return;

    try {
      const followDoc = await getDoc(doc(db, 'users', currentUserId, 'following', username as string));
      setIsFollowing(followDoc.exists());
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  useEffect(() => {
    checkIfBlocked();
    loadUserContent();
  }, [username]);

  const checkIfBlocked = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !username) return;

    try {
      const blockDoc = await getDoc(doc(db, 'users', currentUserId, 'blocked', username as string));
      setIsBlocked(blockDoc.exists());
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleFollowToggle = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }

    if (isFollowing) {
      // Unfollow
      Alert.alert(
        'Unfollow User',
        `Unfollow ${username}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfollow',
            onPress: async () => {
              try {
                await deleteDoc(doc(db, 'users', currentUserId, 'following', username as string));
                setIsFollowing(false);
                Alert.alert('Success', `Unfollowed ${username}`);
              } catch (error) {
                console.error('Error unfollowing user:', error);
                Alert.alert('Error', 'Failed to unfollow user');
              }
            },
          },
        ]
      );
    } else {
      // Follow
      try {
        await setDoc(doc(db, 'users', currentUserId, 'following', username as string), {
          followedUsername: username,
          createdAt: serverTimestamp(),
        });
        setIsFollowing(true);
        Alert.alert('Success', `Now following ${username}`);
      } catch (error) {
        console.error('Error following user:', error);
        Alert.alert('Error', 'Failed to follow user');
      }
    }
  };

  const loadUserContent = () => {
    // Load threads by this user
    const threadsQuery = query(
      collection(db, 'threads'),
      where('author', '==', username)
    );
    
    const unsubThreads = onSnapshot(threadsQuery, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: getRelativeTime(doc.data().createdAt),
      }));
      setThreads(threadsData);
      setLoading(false);
    });

    // Load comments by this user
    const commentsQuery = query(
      collection(db, 'comments'),
      where('author', '==', username)
    );
    
    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: getRelativeTime(doc.data().createdAt),
      }));
      setComments(commentsData);
    });

    return () => {
      unsubThreads();
      unsubComments();
    };
  };

  const renderThread = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/thread?id=${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{item.timestamp}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}
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
    </TouchableOpacity>
  );

  const renderComment = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/thread?id=${item.threadId}`)}
    >
      <Text style={[styles.commentText, { color: colors.text }]} numberOfLines={3}>
        {item.content}
      </Text>
      <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{item.timestamp}</Text>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="thumbs-up-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}> {item.likes || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleBlockUser = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }

    if (isBlocked) {
      // Unblock
      Alert.alert(
        'Unblock User',
        `Unblock ${username}? You will see their posts and comments again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: async () => {
              try {
                await deleteDoc(doc(db, 'users', currentUserId, 'blocked', username as string));
                setIsBlocked(false);
                Alert.alert('Success', `${username} has been unblocked`);
              } catch (error) {
                console.error('Error unblocking user:', error);
                Alert.alert('Error', 'Failed to unblock user');
              }
            },
          },
        ]
      );
    } else {
      // Block
      Alert.alert(
        'Block User',
        `Block ${username}? You will no longer see their posts and comments.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await setDoc(doc(db, 'users', currentUserId, 'blocked', username as string), {
                  blockedUsername: username,
                  createdAt: serverTimestamp(),
                });
                setIsBlocked(true);
                Alert.alert('Success', `${username} has been blocked`);
              } catch (error) {
                console.error('Error blocking user:', error);
                Alert.alert('Error', 'Failed to block user');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{username}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleFollowToggle} style={{ marginRight: 16 }}>
            <Ionicons 
              name={isFollowing ? "person-remove-outline" : "person-add-outline"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBlockUser}>
            <Ionicons name="ban-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'threads' && styles.activeTab]}
          onPress={() => setActiveTab('threads')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'threads' ? colors.primary : colors.textSecondary }]}>
            Threads ({threads.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'comments' ? colors.primary : colors.textSecondary }]}>
            Comments ({comments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'threads' ? threads : comments}
          renderItem={activeTab === 'threads' ? renderThread : renderComment}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ padding: 8 }}
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
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4D0C0C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  card: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  cardHeader: {
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
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});