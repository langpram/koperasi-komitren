// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "messagingSenderId",
  "appId"
];

const isFirebaseConfigured = requiredConfigKeys.every(
  (key) => Boolean(firebaseConfig[key])
);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, isFirebaseConfigured };
