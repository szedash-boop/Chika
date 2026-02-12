import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebaseConfig';
import { getRelativeTime } from '../utils/timeUtils';
import { getBlockedUsernames, getFilteredKeywords } from '../utils/userUtils';
export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'relevant' | 'latest' | 'replies'>('relevant');
  const [loading, setLoading] = useState(true);
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);

  const categories = [
  'All',
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

  useEffect(() => {
    // Load all threads once
    const q = query(collection(db, 'threads'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt ? getRelativeTime(doc.data().createdAt) : 'Unknown',
      }));
      setAllThreads(threadsData);
      setLoading(false);
    });

    return () => unsubscribe();
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
    // Filter and sort threads based on search query, category, and active tab
    let results = allThreads;

    // Filter by search query
    if (searchQuery.trim()) {
      results = results.filter(thread => 
        thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      results = results.filter(thread => thread.category === selectedCategory);
    }
    // Filter out blocked users
    results = results.filter((thread: any) => !blockedUsernames.includes(thread.author));

    // Filter out threads containing filtered keywords
    if (filteredKeywords.length > 0) {
      results = results.filter((thread: any) => {
        const title = thread.title?.toLowerCase() || '';
        const content = thread.content?.toLowerCase() || '';
        return !filteredKeywords.some(keyword => 
          title.includes(keyword) || content.includes(keyword)
        );
      });
    }
    // Sort based on active tab
    if (activeTab === 'latest') {
      results.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
    } else if (activeTab === 'replies') {
      results.sort((a, b) => (b.replies || 0) - (a.replies || 0));
    } else if (activeTab === 'relevant' && searchQuery.trim()) {
      // Simple relevance: exact matches first, then partial matches
      results.sort((a, b) => {
        const aTitle = a.title?.toLowerCase() || '';
        const bTitle = b.title?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        const aExact = aTitle === query ? 2 : (aTitle.startsWith(query) ? 1 : 0);
        const bExact = bTitle === query ? 2 : (bTitle.startsWith(query) ? 1 : 0);
        
        return bExact - aExact;
      });
    }

    setFilteredThreads(results);
  }, [searchQuery, selectedCategory, activeTab, allThreads, blockedUsernames, filteredKeywords]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search threads..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category === 'All' ? null : category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === category ? 'white' : colors.text }
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'relevant' && styles.activeTab]}
          onPress={() => setActiveTab('relevant')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'relevant' ? colors.primary : colors.textSecondary }]}>
            Relevant
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'latest' && styles.activeTab]}
          onPress={() => setActiveTab('latest')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'latest' ? colors.primary : colors.textSecondary }]}>
            Latest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'replies' && styles.activeTab]}
          onPress={() => setActiveTab('replies')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'replies' ? colors.primary : colors.textSecondary }]}>
            Recent Replies
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      ) : searchQuery.trim() === '' ? (
        <View style={styles.centered}>
          <Ionicons name="search" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Search Chika
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Find threads by title or author
          </Text>
        </View>
      ) : filteredThreads.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={80} color={colors.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No results found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Try different keywords
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4D0C0C',
    padding: 12,
    paddingTop: 50,
    gap: 12,
  },
  backButton: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: 'white',
  },
  clearButton: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxHeight: 32,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 3,
    height: 24,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#4D0C0C',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
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
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
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
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});