
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!firebaseApiKey) {
  throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set in the environment variables. Please provide it in your .env file.");
}

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "nextkanban-e4xlu",
  appId: "1:703891136551:web:8d558459c2a39e5e44ee02",
  storageBucket: "nextkanban-e4xlu.firebasestorage.app",
  apiKey: firebaseApiKey,
  authDomain: "nextkanban-e4xlu.firebaseapp.com",
  messagingSenderId: "703891136551"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
