import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function DrawerContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.logo}>Chika</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Left Sidebar */}
        <View style={[styles.sidebar, { backgroundColor: theme === 'dark' ? '#0a0a0a' : '#1a1a1a' }]}>
          <TouchableOpacity style={styles.sidebarButton} onPress={() => { onClose(); router.push('/favorites'); }}>
            <Ionicons name="star" size={26} color="#FFC107" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarButton} onPress={() => { onClose(); router.push('/notifications'); }}>
            <Ionicons name="notifications-outline" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarButton} onPress={() => { onClose(); router.push('/profile'); }}>
            <Ionicons name="person-outline" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarButton, theme === 'dark' && styles.sidebarButtonActive]} onPress={toggleTheme}>
            <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarButton} onPress={() => { onClose(); router.push('/settings'); }}>
            <Ionicons name="settings-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Right Content */}
        <ScrollView style={[styles.content, { backgroundColor: colors.card }]}>
          
          {/* Big 4 Section */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BIG 4</Text>
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Maroon School'); }}>
            <Ionicons name="school-outline" size={20} color="#8B4513" style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Maroon School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Green School'); }}>
            <Ionicons name="school-outline" size={20} color="#4CAF50" style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Green School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Blue School'); }}>
            <Ionicons name="school-outline" size={20} color="#2196F3" style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Blue School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Yellow School'); }}>
            <Ionicons name="school-outline" size={20} color="#FFC107" style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Yellow School</Text>
          </TouchableOpacity>

          {/* Other Categories */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>CATEGORIES</Text>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=School'); }}>
            <Ionicons name="book-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>School</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Love and Dating'); }}>
            <Ionicons name="heart-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Love and Dating</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Work'); }}>
            <Ionicons name="briefcase-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Work</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Politics'); }}>
            <Ionicons name="podium-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Politics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Money & Hustle'); }}>
            <Ionicons name="cash-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Money & Hustle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Rant'); }}>
            <Ionicons name="megaphone-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Rant</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Neighbourhood'); }}>
            <Ionicons name="home-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Neighbourhood</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryItem} onPress={() => { onClose(); router.push('/category?name=Confessions'); }}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text} style={styles.categoryIcon} />
            <Text style={[styles.categoryText, { color: colors.text }]}>Confessions</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 60,
    paddingTop: 20,
    alignItems: 'center',
  },
  sidebarButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sidebarButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '500',
  },
});