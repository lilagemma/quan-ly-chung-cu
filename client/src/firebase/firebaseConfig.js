import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBs3ddNF02zrL-BSm5s-Ti8nZfvaWx-9QI",
  authDomain: "society-management-a932c.firebaseapp.com",
  projectId: "society-management-a932c",
  storageBucket: "society-management-a932c.firebasestorage.app",
  messagingSenderId: "654745729053",
  appId: "1:654745729053:web:dc8a2ff88dbd49be5a6ef4",
};

const app = initializeApp(firebaseConfig);

export async function getFirebaseMessaging() {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}
