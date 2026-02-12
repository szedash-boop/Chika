import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    // Get user's push token from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists() || !userDoc.data().pushToken) {
      console.log('No push token found for user');
      return;
    }

    const pushToken = userDoc.data().pushToken;

    // Send notification via Expo's push notification service
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: { someData: 'goes here' },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('Notification sent:', data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}