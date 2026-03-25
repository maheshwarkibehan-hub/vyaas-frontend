import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuildProcessOnly",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-project.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:dummyId",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DUMMYID",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

// --- History Functions (LocalStorage Version) ---

export interface ChatHistoryItem {
    id: string;
    timestamp: number; // Unix timestamp (seconds)
    messages: any[];
}

export const saveChatHistory = async (userId: string, messages: any[]) => {
    try {
        if (!userId || messages.length === 0) return;

        const key = `chat_history_${userId}`;
        const existingData = localStorage.getItem(key);
        const history: ChatHistoryItem[] = existingData ? JSON.parse(existingData) : [];

        const newItem: ChatHistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now() / 1000,
            messages: messages
        };

        // Add new item to the beginning
        history.unshift(newItem);

        localStorage.setItem(key, JSON.stringify(history));
        console.log("Chat history saved to LocalStorage!");
    } catch (error) {
        console.error("Error saving chat history:", error);
    }
};

export const getUserHistory = async (userId: string): Promise<ChatHistoryItem[]> => {
    try {
        if (!userId) return [];

        const key = `chat_history_${userId}`;
        const data = localStorage.getItem(key);

        if (!data) return [];

        return JSON.parse(data) as ChatHistoryItem[];
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};
