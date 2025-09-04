
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Get Firebase configuration from environment variables
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;
const appId = process.env.FIREBASE_APP_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;

if (!firebaseApiKey || !projectId || !appId || !storageBucket || !authDomain || !messagingSenderId) {
  throw new Error("Firebase configuration is incomplete. Please check your .env file.");
}

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId,
  appId,
  storageBucket,
  apiKey: firebaseApiKey,
  authDomain,
  messagingSenderId
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
