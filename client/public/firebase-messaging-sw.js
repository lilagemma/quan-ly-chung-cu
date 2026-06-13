importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBs3ddNF02zrL-BSm5s-Ti8nZfvaWx-9QI",
  authDomain: "society-management-a932c.firebaseapp.com",
  projectId: "society-management-a932c",
  storageBucket: "society-management-a932c.firebasestorage.app",
  messagingSenderId: "654745729053",
  appId: "1:654745729053:web:dc8a2ff88dbd49be5a6ef4",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Nhận thông báo nền:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.ico", // thay bằng icon của bạn nếu có
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
