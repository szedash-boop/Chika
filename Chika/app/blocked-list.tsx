import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';

export default function BlockedListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'blocked'),
      (snapshot) => {
        const blocked = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBlockedUsers(blocked);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUnblock = (username: string) => {
    Alert.alert(
      'Unblock User',
      `Unblock ${username}? You will see their posts and comments again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              await deleteDoc(doc(db, 'users', userId, 'blocked', username));
              Alert.alert('Success', `${username} has been unblocked`);
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: any) => (
    <View style={[styles.userRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.userInfo}>
        <Ionicons name="person-circle" size={40} color={colors.textSecondary} />
        <Text style={[styles.username, { color: colors.text }]}>{item.blockedUsername}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.unblockButton, { backgroundColor: colors.primary }]}
        onPress={() => handleUnblock(item.blockedUsername)}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked List</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="ban-outline" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No blocked users</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Blocked users will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
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
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unblockText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});