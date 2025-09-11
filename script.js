const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let messaging;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn("FCM初期化スキップ:", e);
}
