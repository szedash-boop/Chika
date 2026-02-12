import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export const getBlockedUsernames = async (): Promise<string[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  try {
    const blockedSnapshot = await getDocs(collection(db, 'users', userId, 'blocked'));
    return blockedSnapshot.docs.map(doc => doc.data().blockedUsername);
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
};
export const getCurrentUsername = async (): Promise<string> => {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    return `Guest_${Math.floor(Math.random() * 10000)}`;
  }

  // Check if user is anonymous (guest)
  if (auth.currentUser?.isAnonymous) {
    return `Guest_${Math.floor(Math.random() * 10000)}`;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().username) {
      return userDoc.data().username;
    }
    return `User_${Math.floor(Math.random() * 10000)}`;
  } catch (error) {
    console.error('Error getting username:', error);
    return `User_${Math.floor(Math.random() * 10000)}`;
  }
};

export const isGuestUser = (): boolean => {
  return !auth.currentUser || auth.currentUser.isAnonymous;
};

export const getFilteredKeywords = async (): Promise<string[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().filteredKeywords) {
      return userDoc.data().filteredKeywords;
    }
    return [];
  } catch (error) {
    console.error('Error getting filtered keywords:', error);
    return [];
  }
};