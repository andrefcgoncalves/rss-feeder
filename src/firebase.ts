import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

// Export initialized services
export const db = getFirestore();
export const storage = getStorage();

// Collection reference
export const FEED_ITEMS_COLLECTION = "feed_items";