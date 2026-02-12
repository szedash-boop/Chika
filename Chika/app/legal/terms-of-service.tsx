import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated: February 9, 2026
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          By accessing and using Chika ("the App"), you agree to be bound by these Terms of Service 
          ("Terms"). If you do not agree to these Terms, please do not use the App.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Description of Service</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Chika is an anonymous forum application that allows users to create posts, comment, 
          share images, GIFs, and stickers, and engage in discussions across various categories. 
          All posts and comments are anonymous.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. User Responsibilities</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You agree to:{'\n'}
          • Use the App in compliance with all applicable laws{'\n'}
          • Not post content that is illegal, harmful, threatening, abusive, harassing, defamatory, 
          vulgar, obscene, or otherwise objectionable{'\n'}
          • Not impersonate any person or entity{'\n'}
          • Not spam, flood, or abuse the platform{'\n'}
          • Not upload viruses or malicious code{'\n'}
          • Not harvest or collect user information{'\n'}
          • Not use the App for commercial purposes without permission{'\n'}
          • Respect intellectual property rights
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Content Guidelines</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={styles.bold}>Prohibited Content:</Text> You may not post content that contains:
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          • Hate speech or discrimination{'\n'}
          • Violence or threats{'\n'}
          • Sexually explicit material{'\n'}
          • Child exploitation{'\n'}
          • Personal information of others (doxxing){'\n'}
          • Misinformation intended to harm{'\n'}
          • Spam or unsolicited advertising
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. User-Generated Content</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You retain ownership of content you post. By posting on Chika, you grant us a worldwide, 
          non-exclusive, royalty-free license to use, display, reproduce, and distribute your content 
          within the App.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We reserve the right to remove any content that violates these Terms without notice.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Anonymous Posting</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          While posts are anonymous, we may retain technical data (IP addresses, device IDs) for 
          security and legal compliance. Anonymity does not grant immunity from legal consequences 
          for illegal activities.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Account Termination</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We reserve the right to suspend or terminate your access to the App at our sole discretion, 
          without notice, for conduct that we believe violates these Terms or is harmful to other 
          users, us, or third parties, or for any other reason.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Intellectual Property</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The App, including its design, features, and functionality, is owned by Chika and 
          protected by copyright, trademark, and other intellectual property laws. You may not 
          copy, modify, or create derivative works without permission.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Disclaimer of Warranties</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The App is provided "as is" without warranties of any kind, either express or implied. 
          We do not guarantee that the App will be uninterrupted, secure, or error-free.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>10. Limitation of Liability</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          To the maximum extent permitted by law, Chika shall not be liable for any indirect, 
          incidental, special, consequential, or punitive damages arising from your use of the App.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>11. Indemnification</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You agree to indemnify and hold harmless Tsismis from any claims, damages, losses, or 
          expenses (including legal fees) arising from your use of the App or violation of these Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>12. Governing Law</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          These Terms are governed by the laws of the Philippines. Any disputes shall be resolved 
          in the courts of the Philippines.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>13. Changes to Terms</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We reserve the right to modify these Terms at any time. We will notify users of material 
          changes by posting the updated Terms in the App. Continued use after changes constitutes 
          acceptance of the new Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>14. Contact Information</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          For questions about these Terms, contact us at:{'\n'}
          Email: legal@chika.app{'\n'}
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