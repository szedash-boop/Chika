import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TermsReviewScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { colors } = useTheme();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const isTerms = type === 'terms';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    // Navigate back with acceptance parameter
    if (router.canGoBack()) {
      router.back();
    }
    // We'll use a different approach - store acceptance in async storage
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isTerms ? 'Terms of Service' : 'Privacy Policy'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {isTerms ? (
          <View style={styles.textContent}>
            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
              Last Updated: February 9, 2026
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              By accessing and using Chika ("the App"), you agree to be bound by these Terms of Service...
            </Text>

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
                      You agree to indemnify and hold harmless Chika from any claims, damages, losses, or 
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. User Responsibilities</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              You agree to use the App responsibly...
            </Text>

            {/* Add remaining sections */}
          </View>
        ) : (
          <View style={styles.textContent}>
            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
              Last Updated: February 9, 2026
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Introduction</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Welcome to Chika. We are committed to protecting your privacy...
            </Text>

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
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {hasScrolledToBottom 
            ? 'You have read the entire document' 
            : 'Scroll to the bottom to accept'}
        </Text>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            { backgroundColor: colors.primary },
            !hasScrolledToBottom && styles.acceptButtonDisabled
          ]}
          onPress={handleAccept}
          disabled={!hasScrolledToBottom}
        >
          <Text style={styles.acceptButtonText}>I Accept</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  textContent: {
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
    height: 100,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  acceptButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.4,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});