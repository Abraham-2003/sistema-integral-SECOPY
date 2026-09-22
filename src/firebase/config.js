import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhO-RteMZ5EHcwqQwKKwNToTRu36xYD8Y",
  authDomain: "secopy.firebaseapp.com",
  projectId: "secopy",
  storageBucket: "secopy.firebasestorage.app",
  messagingSenderId: "1081356066703",
  appId: "1:1081356066703:web:454db5d965a20894e8f5fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)