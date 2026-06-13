import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebaseConfig";

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("❌ Quyền thông báo bị từ chối");
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.log("❌ Firebase messaging không được hỗ trợ");
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey:
      "BDhESc9LVGIBOFE3QK4sr8Z4K82V9-nKKqYPXps6-3e2H3eIoVGiX7rfDUnIX0j2h6jLuccdK6ttlqLrAU4maoQ",
  });

  console.log("✅ FCM TOKEN:", token);
  return token;
}
