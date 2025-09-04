import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase設定（実際の値に置き換え）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// 初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase 初期化完了");

// ログイン処理
document.getElementById("loginBtn").addEventListener("click", async () => {
  const number = document.getElementById("numberInput").value.trim();
  if (!number) {
    alert("番号を入力してください");
    return;
  }

  try {
    // Firestoreの "responsibleNumbers" コレクションに番号があるか確認
    const docRef = doc(db, "responsibleNumbers", number);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const role = docSnap.data().role; // 例: { role: "admin" }
      if (role === "admin") {
        alert("管理者としてログイン成功");
        window.location.href = "admin.html";
      } else {
        alert("ユーザーとしてログイン成功");
        window.location.href = "system.html";
      }
    } else {
      alert("番号が見つかりません");
    }
  } catch (error) {
    console.error("ログインエラー:", error);
    alert("ログイン処理中にエラーが発生しました");
  }
});