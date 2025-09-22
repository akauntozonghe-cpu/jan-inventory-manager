// Firebase モジュールをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM 要素
const input = document.getElementById("userCodeInput");
const btn = document.getElementById("loginBtn");
const editVersionBtn = document.getElementById("editVersionBtn");
const welcomeMessage = document.querySelector(".welcome-message");

// 入力があればボタン有効化
input.addEventListener("input", () => {
  btn.disabled = input.value.trim() === "";
});

// ⌨️ Enterキー対応（入力欄に限定）
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !btn.disabled) {
    btn.click();
  }
});

// 🚪 ログイン処理
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

    // Firebase 認証
    await setPersistence(auth, browserLocalPersistence);
    await signInAnonymously(auth);

    // Firestore にログイン履歴を記録
    const logData = {
      uid,
      id,
      name,
      role,
      timestamp: Timestamp.now(),
      version: "v1.0.0",
      device: `${navigator.platform} / ${navigator.userAgent}`
    };
    await addDoc(collection(db, "loginLogs"), logData);

    // UI 更新
    welcomeMessage.textContent = `🛡️ ようこそ、${name} さん（${role}）──この空間はあなたの判断で動きます。`;
    if (role === "管理者") {
      editVersionBtn.classList.remove("hidden");
    }

    // 遷移
    window.location.href = "home.html";
  } catch (error) {
    console.error("❌ ログイン処理失敗:", error);
    alert("ログインに失敗しました");
  }
});