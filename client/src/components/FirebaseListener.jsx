"use client";
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/firebase/firebaseConfig";

export default function FirebaseListener() {
  useEffect(() => {
    const init = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      // Lắng nghe thông báo khi ứng dụng đang mở
      onMessage(messaging, (payload) => {
        console.log("Nhận thông báo khi đang mở app:", payload);
        // Hiển thị thông báo dạng hệ thống (giống như background)
        if (Notification.permission === "granted") {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: "/favicon.ico",
          });
        }
      });
    };
    init();
  }, []);

  return null;
}
