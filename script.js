// Firebase初期化（非モジュール構成）
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

// Enterキーでログイン実行
document.getElementById("userIdInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    login();
  }
});

// グローバル関数として定義
window.login = async function () {
  const userId = document.getElementById("userIdInput").value.trim();
  const status = document.getElementById("loginStatus");

  if (!userId) {
    status.textContent = "責任者番号を入力してください。";
    return;
  }

  try {
    const snapshot = await db.collection("users").where("id", "==", userId).get();

    if (snapshot.empty) {
      status.textContent = "登録された番号が見つかりません。";
      return;
    }

    const doc = snapshot.docs[0];
    const userData = doc.data();
    const role = userData.role;
    const name = userData.name;

    // FCMトークン取得（通知許可があり、messagingが有効な場合）
    if (messaging && Notification.permission === "granted") {
      try {
        const token = await messaging.getToken({ vapidKey: "YOUR_PUBLIC_VAPID_KEY" });
        await db.collection("users").doc(doc.id).update({ fcmToken: token });
      } catch (e) {
        console.warn("FCMトークン取得失敗:", e);
      }
    }

    // セッション保存
    console.log("ログイン成功:", { userId, name, role });
    sessionStorage.setItem("userId", userId);
    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("userRole", role);

    // 遷移
    window.location.href = "home.html";
  } catch (error) {
    console.error("ログインエラー:", error);
    status.textContent = "ログイン中にエラーが発生しました。";
  }
};
