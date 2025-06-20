// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0xlo9AfCn1ylyvnMFAhxL8OvTq3OzNoU",
  authDomain: "class-8f094.firebaseapp.com",
  projectId: "class-8f094",
  storageBucket: "class-8f094.firebasestorage.app",
  messagingSenderId: "1013894187355",
  appId: "1:1013894187355:web:696c05509f3bbc751f327e",
  measurementId: "G-SV8CSVTCL2"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

let analytics: Analytics | undefined;
// Ensure Firebase Analytics is initialized only on the client side
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, analytics };
