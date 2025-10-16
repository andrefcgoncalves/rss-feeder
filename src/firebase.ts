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

// Collection references
export const FEED_ITEMS_COLLECTION = "feed_items";
export const NEWSLETTER_ITEMS_COLLECTION = "newsletter_items";