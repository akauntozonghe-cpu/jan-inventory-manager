// Firebase初期化
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const messaging = firebase.messaging();

// ログイン処理
window.login = async function () {
  const userId = document.getElementById("userIdInput").value.trim();
  const status = document.getElementById("loginStatus");

  if (!userId) {
    status.textContent = "責任者番号を入力してください。";
    return;
  }

  try {
    const snapshot = await db.ref("users/" + userId).once("value");
    const userData = snapshot.val();

    if (!userData) {
      status.textContent = "番号が見つかりません。";
      return;
    }

    const role = userData.権限;
    const name = userData.氏名;

    // FCMトークン取得
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await messaging.getToken({ vapidKey: "YOUR_PUBLIC_VAPID_KEY" });
      await db.ref("users/" + userId + "/fcmToken").set(token);
    }

    // ログイン情報をセッションに保存
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