// Firebase モジュールをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase 初期化
const firebaseConfig = { /* ← 既存の設定をそのまま */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM 要素
const input = document.getElementById("userCodeInput");
const btn = document.getElementById("loginBtn");
const welcomeMessage = document.querySelector(".welcome-message");

// 🔍 入力時に即 Firestore 照合してメッセージ表示
input.addEventListener("input", async () => {
  const inputId = input.value.trim();
  btn.disabled = inputId === "";

  if (!inputId) {
    welcomeMessage.textContent = "この空間は、あなたの責任と誇りを表現する場です。";
    return;
  }

  try {
    const q = query(collection(db, "users"), where("id", "==", inputId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      welcomeMessage.textContent = "⚠️ 責任者番号が認識されません。";
      return;
    }

    const data = snapshot.docs[0].data();
    const { name, role } = data;

    // 入力時点で即メッセージ更新
    welcomeMessage.textContent = `🛡️ ${name} さん（${role}）としてログイン可能です。`;
  } catch (err) {
    console.error("番号照合エラー:", err);
    welcomeMessage.textContent = "⚠️ 照合中にエラーが発生しました";
  }
});

// ⌨️ Enterキー対応
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !btn.disabled) {
    btn.click();
  }
});

// 🚪 ログイン処理（実際の認証＋遷移）
btn.addEventListener("click", async () => {
  const inputId = input.value.trim();
  if (!inputId) return;

  try {
    // Firestore 照合
    const q = query(collection(db, "users"), where("id", "==", inputId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("⚠️ 責任者番号が認識されません。");
      return;
    }

    const data = snapshot.docs[0].data();
    const { id, name, role, uid } = data;

    // localStorage 保存
    localStorage.setItem("uid", uid);
    localStorage.setItem("role", role);
    localStorage.setItem("name", name);
    localStorage.setItem("lastLogin", new Date().toISOString());

    // Firebase 認証
    await setPersistence(auth, browserLocalPersistence);
    await signInAnonymously(auth);

    // Firestore にログイン履歴を記録
    const logData = {
      uid, id, name, role,
      timestamp: Timestamp.now(),
      version: "v1.0.0",
      device: `${navigator.platform} / ${navigator.userAgent}`
    };
    await addDoc(collection(db, "loginLogs"), logData);

    // 🚪 遷移（編集ボタンの表示制御は home.js 側で行う）
    window.location.href = "home.html";
  } catch (error) {
    console.error("❌ ログイン処理失敗:", error);
    alert("ログインに失敗しました");
  }
});