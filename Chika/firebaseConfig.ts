// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBI7EENmwyuHyP90ZefBQFB7dUAtH02eJg",
  authDomain: "lihkg-ph.firebaseapp.com",
  projectId: "lihkg-ph",
  storageBucket: "lihkg-ph.firebasestorage.app",
  messagingSenderId: "390572805763",
  appId: "1:390572805763:web:d8840033c8859b996c55b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);