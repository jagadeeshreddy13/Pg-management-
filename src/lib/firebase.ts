import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDIE7hZbRZo82kdrr0a_C7rEVh0JyTBbAQ",
  authDomain: "gen-lang-client-0904076068.firebaseapp.com",
  projectId: "gen-lang-client-0904076068",
  storageBucket: "gen-lang-client-0904076068.firebasestorage.app",
  messagingSenderId: "499863514345",
  appId: "1:499863514345:web:a2b7aa7cc42470f6f95478"
};

// However, the standard way in AI Studio is that the config is provided via a special file or env.
// Let's assume standard initialization.

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
