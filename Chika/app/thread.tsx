import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EditCommentModal from '../components/EditCommentModal';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';
import { sendPushNotification } from '../sendNotification';
import { getRelativeTime } from '../utils/timeUtils';
import { getBlockedUsernames, getCurrentUsername, getFilteredKeywords } from '../utils/userUtils';


interface Thread {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  author?: string;
  userId?: string;
  imageUrl?: string;
  likes?: number;
  dislikes?: number;
  replies?: number;
  createdAt?: any;
  timestamp?: string;
}

export default function ThreadScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [thread, setThread] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hotModalVisible, setHotModalVisible] = useState(false);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'thread' | 'comment', id: string } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentMenuVisible, setCommentMenuVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set());

  const canEdit = (createdAt: any) => {
    if (!createdAt) return false;
    const now = new Date();
    const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffMinutes = (now.getTime() - created.getTime()) / 1000 / 60;
    return diffMinutes <= 15;
  };

  const handleEditThread = () => {
    router.push(`/edit-post?id=${id}`);
  };

  const handleDeleteThread = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'threads', id as string));
              Alert.alert('Success', 'Post deleted');
              router.back();
            } catch (error) {
              console.error('Error deleting thread:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };
  const handleEditComment = (comment: any) => {
    setSelectedComment(comment);
    setCommentMenuVisible(false); // Close the menu
    // The modal will be opened by setting selectedComment and commentMenuVisible
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'comments', commentId));
              await updateDoc(doc(db, 'threads', id as string), {
                replies: increment(-1),
              });
              Alert.alert('Success', 'Comment deleted');
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };
  const handleReport = async (reason: string) => {
    if (!reportTarget) return;

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be signed in to report');
        return;
      }

      await addDoc(collection(db, 'reports'), {
        reportedBy: userId,
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reason,
        createdAt: serverTimestamp(),
      });

      setReportModalVisible(false);
      setReportTarget(null);
      Alert.alert('Thank you', 'Report submitted. We will review it shortly.');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };
  const categoryColor = theme === 'dark' ? '#FF8A80' : colors.primary;

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
    if (!id) return;

    // Real-time thread updates
    const threadRef = doc(db, 'threads', id as string);
    const unsubThread = onSnapshot(threadRef, (doc) => {
      if (doc.exists()) {
        setThread({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    // Real-time comments updates
    const q = query(collection(db, 'comments'), where('threadId', '==', id));
    const unsubComments = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      
      // Filter out blocked users' comments
      const filteredBlockedComments = commentsData.filter((comment: any) => !blockedUsernames.includes(comment.author));
      
      // Filter out comments containing filtered keywords
      const finalFilteredComments = filteredBlockedComments.filter((comment: any) => {
        const content = comment.content?.toLowerCase() || '';
        return !filteredKeywords.some(keyword => content.includes(keyword));
      });
      
      setComments(finalFilteredComments);
    });

    return () => {
      unsubThread();
      unsubComments();
    };
  }, [id, blockedUsernames, filteredKeywords, showHiddenContent]);

  // Check if thread is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId || !id) return;
      const favDoc = await getDoc(doc(db, 'users', userId, 'favorites', id as string));
      setIsFavorited(favDoc.exists());
    };
    checkFavorite();
  }, [id]);

  const MAX_DEPTH = 6;
  const THREAD_COLORS = ['#4D0C0C', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

  const buildCommentTree = (parentId: string | null = null): any[] => {
    return comments
      .filter(c => (c.parentCommentId || null) === parentId)
      .map(comment => ({
        ...comment,
        replies: buildCommentTree(comment.id),
      }));
  };

  const commentTree = buildCommentTree();

  const renderComment = (comment: any, depth: number = 0): React.ReactNode => {
    const clampedDepth = Math.min(depth, MAX_DEPTH);
    const threadColor = THREAD_COLORS[clampedDepth % THREAD_COLORS.length];

    return (
      <View
        key={comment.id}
        style={depth > 0 ? {
          marginLeft: depth <= MAX_DEPTH ? 12 : 0,
          borderLeftWidth: 2,
          borderLeftColor: threadColor,
          paddingLeft: 8,
          marginTop: 6,
        } : undefined}
      >
        <TouchableOpacity
          onLongPress={() => {
            setSelectedComment(comment);
            setCommentMenuVisible(true);
          }}
          activeOpacity={0.9}
        >
          <View style={[styles.commentCard, { backgroundColor: depth === 0 ? colors.card : colors.background }]}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => router.push(`/user-profile?username=${encodeURIComponent(comment.author)}`)}>
  <Text style={[styles.commentAuthor, { color: '#2196F3' }]}>
    {comment.author}
  </Text>
</TouchableOpacity>
            <Text style={[styles.commentTimestamp, { color: colors.textSecondary }]}>{getRelativeTime(comment.createdAt)}</Text>
          </View>
          <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
          
          {comment.imageUrl && (
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => setRevealedImages(prev => new Set(prev).add(comment.id + '-image'))}
            >
              <Image 
                source={{ uri: comment.imageUrl }} 
                style={styles.commentImage}
                blurRadius={revealedImages.has(comment.id + '-image') ? 0 : 20}
              />
              {!revealedImages.has(comment.id + '-image') && (
                <View style={styles.blurOverlay}>
                  <Ionicons name="eye-outline" size={30} color="white" />
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {comment.gifUrl && (
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => setRevealedImages(prev => new Set(prev).add(comment.id + '-gif'))}
            >
              <Image 
                source={{ uri: comment.gifUrl }} 
                style={styles.commentImage}
                blurRadius={revealedImages.has(comment.id + '-gif') ? 0 : 20}
              />
              {!revealedImages.has(comment.id + '-gif') && (
                <View style={styles.blurOverlay}>
                  <Ionicons name="eye-outline" size={30} color="white" />
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {comment.stickerUrl && (
            comment.stickerUrl.startsWith('http') ? (
              <Image source={{ uri: comment.stickerUrl }} style={styles.stickerImage} />
            ) : (
              <Text style={styles.emojiStickerDisplay}>{comment.stickerUrl}</Text>
            )
          )}
          <View style={styles.commentFooter}>
            <View style={[styles.voteBox, { borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => handleVoteComment(comment.id, 'like')} style={styles.voteButton}>
                <Ionicons name="arrow-up" size={18} color={colors.textSecondary} />
                <Text style={[styles.voteCount, { color: colors.text }]}>{comment.likes || 0}</Text>
              </TouchableOpacity>
              <View style={styles.voteDivider} />
              <TouchableOpacity onPress={() => handleVoteComment(comment.id, 'dislike')} style={styles.voteButton}>
                <Ionicons name="arrow-down" size={18} color={colors.textSecondary} />
                <Text style={[styles.voteCount, { color: colors.text }]}>{comment.dislikes || 0}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.replyIconButton}
              onPress={() => {
                router.push(
                  `/create-comment?threadId=${id}&parentCommentId=${comment.id}&parentAuthor=${encodeURIComponent(comment.author)}&threadTitle=${encodeURIComponent(thread?.title || '')}`
                );
              }}
            >
              <Ionicons name="arrow-undo-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        </TouchableOpacity>
        {comment.replies?.map((reply: any) => renderComment(reply, depth + 1))}
      </View>
      
    );
  };

  const handleVoteComment = async (commentId: string, voteType: 'like' | 'dislike') => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be signed in to vote');
        return;
      }

      const voteId = `${userId}_${commentId}`;
      const voteRef = doc(db, 'votes', voteId);
      const voteDoc = await getDoc(voteRef);

      if (voteDoc.exists()) {
        const existingVote = voteDoc.data().voteType;
        if (existingVote === voteType) {
          await deleteDoc(voteRef);
          await updateDoc(doc(db, 'comments', commentId), {
            [voteType === 'like' ? 'likes' : 'dislikes']: increment(-1),
          });
        } else {
          await updateDoc(voteRef, { voteType });
          await updateDoc(doc(db, 'comments', commentId), {
            likes: increment(voteType === 'like' ? 1 : -1),
            dislikes: increment(voteType === 'dislike' ? 1 : -1),
          });
        }
      } else {
        await setDoc(voteRef, {
          userId,
          targetId: commentId,
          targetType: 'comment',
          voteType,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'comments', commentId), {
          [voteType === 'like' ? 'likes' : 'dislikes']: increment(1),
        });

        // Send notification for likes only
        if (voteType === 'like') {
          try {
            const commentDoc = await getDoc(doc(db, 'comments', commentId));
            if (commentDoc.exists()) {
              const commentAuthorId = commentDoc.data().userId;
              if (commentAuthorId && commentAuthorId !== userId) {
                const authorDoc = await getDoc(doc(db, 'users', commentAuthorId));
                const username = await getCurrentUsername();
                if (authorDoc.exists() && authorDoc.data().pushToken) {
                  const notifSettings = authorDoc.data().notificationSettings || {};
                  // Check if user has comment like notifications enabled (default true)
                  if (notifSettings.commentLikes !== false) {
                    await sendPushNotification(
                      authorDoc.data().pushToken,
                      'New Like',
                      `${username} liked your comment`
                    );
                  }
                }
              }
            }
          } catch (notifError) {
            console.error('Error sending comment like notification:', notifError);
          }
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const handleVoteThread = async (voteType: 'like' | 'dislike') => {
    try {
      if (!id || !auth.currentUser) {
        Alert.alert('Error', 'You must be signed in to vote');
        return;
      }

      const threadId = id as string;
      const userId = auth.currentUser.uid;
      const voteRef = doc(db, 'votes', `${userId}_${threadId}`);
      const voteDoc = await getDoc(voteRef);

      if (voteDoc.exists() && voteDoc.data().voteType === voteType) {
        // Remove vote
        await deleteDoc(voteRef);
        await updateDoc(doc(db, 'threads', threadId), {
          [voteType === 'like' ? 'likes' : 'dislikes']: increment(-1),
        });
        setUserVote(null);
      } else {
        // Add or change vote
        if (voteDoc.exists()) {
          const oldVoteType = voteDoc.data().voteType;
          await updateDoc(doc(db, 'threads', threadId), {
            [oldVoteType === 'like' ? 'likes' : 'dislikes']: increment(-1),
          });
        }
        
        await setDoc(voteRef, {
          userId: userId,
          targetId: threadId,
          targetType: 'thread',
          voteType,
          createdAt: serverTimestamp(),
        });
        
        await updateDoc(doc(db, 'threads', threadId), {
          [voteType === 'like' ? 'likes' : 'dislikes']: increment(1),
        });
        
        setUserVote(voteType);
        // Send notification for likes only (not dislikes)
      if (voteType === 'like') {
        try {
          const threadAuthorId = thread?.userId;
          if (threadAuthorId && threadAuthorId !== auth.currentUser?.uid) {
            const authorDoc = await getDoc(doc(db, 'users', threadAuthorId));
            const username = await getCurrentUsername();
            if (authorDoc.exists() && authorDoc.data().pushToken) {
              const notifSettings = authorDoc.data().notificationSettings || {};
              // Check if user has post like notifications enabled (default true)
              if (notifSettings.postLikes !== false) {
                await sendPushNotification(
                  authorDoc.data().pushToken,
                  'New Like',
                  `${username} liked your post: "${thread?.title}"`
                );
              }
            }
          }
        } catch (notifError) {
          console.error('Error sending like notification:', notifError);
        }
      }

      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const toggleFavorite = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be signed in');
        return;
      }

      const favRef = doc(db, 'users', userId, 'favorites', id as string);

      if (isFavorited) {
        await deleteDoc(favRef);
        setIsFavorited(false);
        Alert.alert('Removed from favorites');
      } else {
        await setDoc(favRef, {
          threadId: id,
          createdAt: serverTimestamp(),
        });
        setIsFavorited(true);
        Alert.alert('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this thread on Chika: ${thread?.title}\n\nchika://thread/${id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const getHotComments = () => {
    return [...comments]
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 10);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thread not found</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {thread?.title}
        </Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={{ paddingBottom: 70 }}>
        <View style={[styles.originalPost, { backgroundColor: colors.card }]}>
          <View style={styles.postHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{thread?.category}</Text>
            </View>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{getRelativeTime(thread?.createdAt)}</Text>
          </View>
           {thread?.content && (
  (filteredKeywords.some(keyword => 
    (thread?.title?.toLowerCase() || '').includes(keyword) || 
    (thread?.content?.toLowerCase() || '').includes(keyword)
  ) && !showHiddenContent) ? (
    <View style={[styles.hiddenContentContainer, { backgroundColor: colors.card }]}>
      <Ionicons name="eye-off-outline" size={24} color={colors.textSecondary} />
      <Text style={[styles.hiddenContentText, { color: colors.textSecondary }]}>
        Content hidden due to keyword filter
      </Text>
      <TouchableOpacity onPress={() => setShowHiddenContent(true)}>
        <Text style={[styles.revealContentText, { color: colors.primary }]}>Reveal Content</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Text style={[styles.postContent, { color: colors.text }]}>
      {thread.content}
    </Text>
  )
)}
          {thread?.imageUrl && (
  <TouchableOpacity 
    style={styles.imageContainer}
    onPress={() => setRevealedImages(prev => new Set(prev).add('thread-image'))}
  >
    <Image
      source={{ uri: thread.imageUrl }}
      style={styles.threadImage}
      blurRadius={revealedImages.has('thread-image') ? 0 : 20}
    />
    {!revealedImages.has('thread-image') && (
      <View style={styles.blurOverlay}>
        <Ionicons name="eye-outline" size={40} color="white" />
        <Text style={styles.blurText}>Tap to view</Text>
      </View>
    )}
  </TouchableOpacity>
)}
          <View style={styles.postFooter}>
            <TouchableOpacity onPress={() => router.push(`/user-profile?username=${encodeURIComponent(thread?.author)}`)}>
  <Text style={[styles.author, { color: '#2196F3' }]}>
    {thread?.author}
  </Text>
</TouchableOpacity>
            <View style={styles.actionButtons}>
              <View style={[styles.voteBox, { borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => handleVoteThread('like')} style={styles.voteButton}>
                  <Ionicons name="arrow-up" size={18} color={userVote === 'like' ? '#4CAF50' : colors.textSecondary} />
                  <Text style={[styles.voteCount, { color: colors.text }]}>{thread?.likes || 0}</Text>
                </TouchableOpacity>
                <View style={styles.voteDivider} />
                <TouchableOpacity onPress={() => handleVoteThread('dislike')} style={styles.voteButton}>
                  <Ionicons name="arrow-down" size={18} color={userVote === 'dislike' ? '#ff4444' : colors.textSecondary} />
                  <Text style={[styles.voteCount, { color: colors.text }]}>{thread?.dislikes || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>{comments.length} Replies</Text>
          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>No comments yet</Text>
              <Text style={[styles.emptyCommentsSubtext, { color: colors.textSecondary }]}>Be the first to reply!</Text>
            </View>
          ) : (
            commentTree.map((comment) => renderComment(comment, 0))
          )}
        </View>
      </ScrollView>

      {/* Hot Comments Modal */}
      <Modal
        visible={hotModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHotModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.hotModalOverlay}
          activeOpacity={1}
          onPress={() => setHotModalVisible(false)}
        >
          <View
            style={[styles.hotModal, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.hotModalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.hotModalTitleRow}>
                <Ionicons name="flame-outline" size={20} color={categoryColor} />
                <Text style={[styles.hotModalTitle, { color: colors.text }]}>Hot Comments</Text>
              </View>
              <TouchableOpacity onPress={() => setHotModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.hotModalBody}>
              {getHotComments().length === 0 ? (
                <Text style={[styles.hotModalEmpty, { color: colors.textSecondary }]}>No comments yet</Text>
              ) : (
                getHotComments().map((comment, index) => (
                  <View key={comment.id} style={[styles.hotCommentItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.hotCommentRank}>
                      <Text style={[styles.hotCommentRankText, { color: categoryColor }]}>#{index + 1}</Text>
                    </View>
                    <View style={styles.hotCommentBody}>
                      <Text style={[styles.hotCommentAuthor, { color: colors.text }]}>{comment.author}</Text>
                      <Text style={[styles.hotCommentText, { color: colors.text }]} numberOfLines={3}>
                        {comment.content}
                      </Text>
                      <View style={styles.hotCommentLikeRow}>
                        <Ionicons name="arrow-up" size={12} color={colors.textSecondary} />
                        <Text style={[styles.hotCommentLikes, { color: colors.textSecondary }]}>
                          {comment.likes || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Toolbar */}
      <View style={[styles.bottomToolbar, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.7} onPress={toggleFavorite}>
          <Ionicons name={isFavorited ? 'star' : 'star-outline'} size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          activeOpacity={0.7}
          onPress={() => router.push(`/gallery?threadId=${id}`)}
        >
          <Ionicons name="images-outline" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          activeOpacity={0.7}
          onPress={() => router.push(`/create-comment?threadId=${id}&threadTitle=${encodeURIComponent(thread?.title || '')}`)}
        >
          <Ionicons name="chatbubble-outline" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.7} onPress={() => setHotModalVisible(true)}>
          <Ionicons name="flame-outline" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.7} onPress={handleShare}>
          <Ionicons name="share-outline" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} activeOpacity={0.7} onPress={scrollToBottom}>
          <Ionicons name="arrow-down-outline" size={26} color="white" />
        </TouchableOpacity>
      </View>
      {/* Thread Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuModal, { backgroundColor: colors.card }]}>
            {thread?.userId === auth.currentUser?.uid && (
              <>
                {canEdit(thread?.createdAt) && (
                  <TouchableOpacity
                    style={[styles.menuOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setMenuVisible(false);
                      handleEditThread();
                    }}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.text} />
                    <Text style={[styles.menuOptionText, { color: colors.text }]}>Edit Post</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.menuOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setMenuVisible(false);
                    handleDeleteThread();
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  <Text style={[styles.menuOptionText, { color: '#ff4444' }]}>Delete Post</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                setReportTarget({ type: 'thread', id: id as string });
                setReportModalVisible(true);
              }}
            >
              <Ionicons name="flag-outline" size={20} color={colors.text} />
              <Text style={[styles.menuOptionText, { color: colors.text }]}>Report Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Comment Menu Modal */}
      <Modal
        visible={commentMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCommentMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCommentMenuVisible(false)}
        >
          <View style={[styles.menuModal, { backgroundColor: colors.card }]}>
            {selectedComment?.userId === auth.currentUser?.uid && (
              <>
                {canEdit(selectedComment?.createdAt) && (
                  <TouchableOpacity
                    style={[styles.menuOption, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setCommentMenuVisible(false);
                      handleEditComment(selectedComment);
                    }}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.text} />
                    <Text style={[styles.menuOptionText, { color: colors.text }]}>Edit Comment</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.menuOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCommentMenuVisible(false);
                    handleDeleteComment(selectedComment.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  <Text style={[styles.menuOptionText, { color: '#ff4444' }]}>Delete Comment</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setCommentMenuVisible(false);
                setReportTarget({ type: 'comment', id: selectedComment.id });
                setReportModalVisible(true);
              }}
            >
              <Ionicons name="flag-outline" size={20} color={colors.text} />
              <Text style={[styles.menuOptionText, { color: colors.text }]}>Report Comment</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.reportModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.reportTitle, { color: colors.text }]}>Report Content</Text>
            <Text style={[styles.reportSubtitle, { color: colors.textSecondary }]}>
              Why are you reporting this?
            </Text>

            <TouchableOpacity 
              style={[styles.reportOption, { borderBottomColor: colors.border }]}
              onPress={() => handleReport('spam')}
            >
              <Text style={[styles.reportOptionText, { color: colors.text }]}>Spam</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reportOption, { borderBottomColor: colors.border }]}
              onPress={() => handleReport('harassment')}
            >
              <Text style={[styles.reportOptionText, { color: colors.text }]}>Harassment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reportOption, { borderBottomColor: colors.border }]}
              onPress={() => handleReport('inappropriate')}
            >
              <Text style={[styles.reportOptionText, { color: colors.text }]}>Inappropriate Content</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reportOption, { borderBottomColor: colors.border }]}
              onPress={() => handleReport('misinformation')}
            >
              <Text style={[styles.reportOptionText, { color: colors.text }]}>Misinformation</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.reportOption}
              onPress={() => handleReport('other')}
            >
              <Text style={[styles.reportOptionText, { color: colors.text }]}>Other</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reportCancel, { backgroundColor: colors.primary }]}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={styles.reportCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Comment Modal */}
      {selectedComment && (
        <EditCommentModal
          isVisible={!!selectedComment}
          onClose={() => setSelectedComment(null)}
          comment={selectedComment}
          threadId={id as string}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  originalPost: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voteBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    gap: 6,
  },
  threadImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  commentsSection: {
    padding: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  commentCard: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  commentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
    resizeMode: 'cover',
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  replyIconButton: {
    padding: 6,
  },
  stickerImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginVertical: 8,
    resizeMode: 'contain',
  },
  emojiStickerDisplay: {
    fontSize: 60,
    marginVertical: 8,
  },

  // Bottom Toolbar
  bottomToolbar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  toolbarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  // Hot Comments Modal
  hotModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  hotModal: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  hotModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  hotModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hotModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  hotModalBody: {
    paddingBottom: 40,
  },
  hotModalEmpty: {
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
  },
  hotCommentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hotCommentRank: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotCommentRankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  hotCommentBody: {
    flex: 1,
    gap: 4,
  },
  hotCommentAuthor: {
    fontSize: 13,
    fontWeight: '600',
  },
  hotCommentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  hotCommentLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hotCommentLikes: {
    fontSize: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  voteDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#666',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  reportOption: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reportOptionText: {
    fontSize: 16,
  },
  reportCancel: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hiddenContentContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  hiddenContentText: {
    fontSize: 14,
    textAlign: 'center',
  },
  revealContentText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuModal: {
    position: 'absolute',
    top: 100,
    right: 16,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuOptionText: {
    fontSize: 16,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
  position: 'relative',
},
blurOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
blurText: {
  color: 'white',
  marginTop: 8,
  fontSize: 14,
},

});
