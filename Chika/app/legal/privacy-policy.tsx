import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated: February 9, 2026
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Introduction</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Welcome to Chika ("we," "our," or "us"). We are committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, and safeguard your information when you 
          use our mobile application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={styles.bold}>Anonymous User Data:</Text> We use anonymous authentication, 
          meaning we do not collect personal identifiable information such as your name, email, 
          or phone number unless you choose to provide it.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={styles.bold}>Content You Post:</Text> Posts, comments, images, GIFs, and 
          stickers you share on the platform.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={styles.bold}>Device Information:</Text> We may collect device type, 
          operating system, and unique device identifiers for app functionality and analytics.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={styles.bold}>Usage Data:</Text> Information about how you use the app, 
          including features accessed and time spent.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use the collected information to:
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          • Provide and maintain the Chika service{'\n'}
          • Enable you to post and interact with content{'\n'}
          • Send push notifications (if enabled){'\n'}
          • Improve app functionality and user experience{'\n'}
          • Detect and prevent abuse or violations of our Terms of Service{'\n'}
          • Comply with legal obligations
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Data Storage and Security</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Your data is stored securely using Firebase services (Google Cloud Platform). We implement 
          industry-standard security measures to protect your information. However, no method of 
          transmission over the internet is 100% secure.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Third-Party Services</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use third-party services that may collect information:
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          • Firebase (Google) - Authentication, database, storage{'\n'}
          • Giphy - GIF search and display{'\n'}
          • Expo - App development and push notifications
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Your Rights</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You have the right to:{'\n'}
          • Access your data{'\n'}
          • Delete your account and associated data{'\n'}
          • Opt out of push notifications{'\n'}
          • Request data export
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Children's Privacy</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chika is not intended for users under 13 years of age. We do not knowingly collect 
          information from children under 13. If you are a parent and believe your child has 
          provided us with personal information, please contact us.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to This Policy</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may update this Privacy Policy from time to time. We will notify you of changes by 
          posting the new policy in the app and updating the "Last Updated" date.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Contact Us</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          If you have questions about this Privacy Policy, please contact us at:{'\n'}
          Email: privacy@chika.app{'\n'}
          (Update with your actual contact information)
        </Text>

        <View style={styles.spacer} />
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  spacer: {
    height: 40,
  },
});