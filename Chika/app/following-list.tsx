import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';

export default function FollowingListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'following'),
      (snapshot) => {
        const following = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFollowingUsers(following);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUnfollow = (username: string) => {
    Alert.alert(
      'Unfollow User',
      `Unfollow ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              await deleteDoc(doc(db, 'users', userId, 'following', username));
              Alert.alert('Success', `Unfollowed ${username}`);
            } catch (error) {
              console.error('Error unfollowing user:', error);
              Alert.alert('Error', 'Failed to unfollow user');
            }
          },
        },
      ]
    );
  };

  const renderFollowingUser = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.userRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={() => router.push(`/user-profile?username=${encodeURIComponent(item.followedUsername)}`)}
    >
      <View style={styles.userInfo}>
        <Ionicons name="person-circle" size={40} color={colors.textSecondary} />
        <Text style={[styles.username, { color: colors.text }]}>{item.followedUsername}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.unfollowButton, { backgroundColor: colors.primary }]}
        onPress={(e) => {
          e.stopPropagation();
          handleUnfollow(item.followedUsername);
        }}
      >
        <Text style={styles.unfollowText}>Unfollow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      ) : followingUsers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Not following anyone yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Follow users to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={followingUsers}
          renderItem={renderFollowingUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centered: {
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
  },
  list: {
    padding: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unfollowText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});