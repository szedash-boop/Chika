import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';

export default function KeywordFilterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists() && userDoc.data().filteredKeywords) {
        setKeywords(userDoc.data().filteredKeywords);
      }
    } catch (error) {
      console.error('Error loading keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) {
      Alert.alert('Error', 'Please enter a keyword');
      return;
    }

    const keyword = newKeyword.trim().toLowerCase();

    if (keywords.includes(keyword)) {
      Alert.alert('Error', 'Keyword already exists');
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be signed in');
        return;
      }

      const updatedKeywords = [...keywords, keyword];
      await setDoc(
        doc(db, 'users', userId),
        { filteredKeywords: updatedKeywords },
        { merge: true }
      );

      setKeywords(updatedKeywords);
      setNewKeyword('');
      Alert.alert('Success', 'Keyword added');
    } catch (error) {
      console.error('Error adding keyword:', error);
      Alert.alert('Error', 'Failed to add keyword');
    }
  };

  const removeKeyword = async (keyword: string) => {
    Alert.alert(
      'Remove Keyword',
      `Remove "${keyword}" from filter?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              const updatedKeywords = keywords.filter(k => k !== keyword);
              await setDoc(
                doc(db, 'users', userId),
                { filteredKeywords: updatedKeywords },
                { merge: true }
              );

              setKeywords(updatedKeywords);
              Alert.alert('Success', 'Keyword removed');
            } catch (error) {
              console.error('Error removing keyword:', error);
              Alert.alert('Error', 'Failed to remove keyword');
            }
          },
        },
      ]
    );
  };

  const renderKeyword = ({ item }: any) => (
    <View style={[styles.keywordRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Text style={[styles.keywordText, { color: colors.text }]}>{item}</Text>
      <TouchableOpacity onPress={() => removeKeyword(item)}>
        <Ionicons name="close-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keyword Filter</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.addSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Keyword</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Posts containing these keywords will be hidden
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Enter keyword..."
            placeholderTextColor={colors.textSecondary}
            value={newKeyword}
            onChangeText={setNewKeyword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={addKeyword}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      ) : keywords.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="funnel-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No filtered keywords</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Add keywords to filter posts
          </Text>
        </View>
      ) : (
        <FlatList
          data={keywords}
          renderItem={renderKeyword}
          keyExtractor={(item) => item}
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
  addSection: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  keywordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  keywordText: {
    fontSize: 16,
    fontWeight: '500',
  },
});