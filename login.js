import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase初期化
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

// 管理者ID一覧
const adminIds = ["2488", "1011"];

window.addEventListener("DOMContentLoaded", () => {
  const userCodeInput = document.getElementById("userIdInput");
  const loginBtn = document.getElementById("loginBtn");
  const editVersionBtn = document.getElementById("editVersionBtn");
  const welcomeMessage = document.querySelector(".welcome-message");

  if (!userCodeInput || !loginBtn || !editVersionBtn || !welcomeMessage) {
    console.error("空間の入口要素が見つかりません。HTML構造を確認してください。");
    return;
  }

  // Enterキー対応
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !loginBtn.disabled) {
      loginBtn.click();
    }
  });

  // 入力監視
  userCodeInput.addEventListener("input", async () => {
    const inputId = userCodeInput.value.trim();
    if (!inputId) {
      resetUI();
      return;
    }

    try {
      const q = query(collection(db, "users"), where("id", "==", inputId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        welcomeMessage.textContent = "⚠️ 責任者番号が認識されません。";
        resetUI();
        return;
      }

      const data = snapshot.docs[0].data();
      const { id, name, role, uid } = data;

      loginBtn.disabled = false;
      loginBtn.classList.add("active");
      loginBtn.dataset.userId = id;
      loginBtn.dataset.userName = name;
      loginBtn.dataset.userRole = role;
      loginBtn.dataset.userUid = uid;

      localStorage.setItem("uid", uid);

      welcomeMessage.textContent = `🛡️ ようこそ、${name} さん（${role}）──この空間はあなたの判断で動きます。`;

      if (adminIds.includes(id)) {
        editVersionBtn.classList.remove("hidden");
      } else {
        editVersionBtn.classList.add("hidden");
      }
    } catch (error) {
      console.error("❌ Firestore照合エラー:", error);
      resetUI();
    }
  });

  // ログイン処理
  loginBtn.addEventListener("click", async () => {
    const id = loginBtn.dataset.userId;
    const name = loginBtn.dataset.userName;
    const role = loginBtn.dataset.userRole;
    const uid = loginBtn.dataset.userUid;

    if (!id || !name || !role || !uid) {
      console.error("❌ ログイン情報が不完全です。");
      return;
    }

    const logData = {
      uid,
      id,
      name,
      role,
      timestamp: new Date().toISOString(),
      version: "v1.0.0",
      device: `${navigator.platform} / ${navigator.userAgent}`
    };

    try {
      await addDoc(collection(db, "loginLogs"), logData);
      console.log("✅ ログイン履歴を記録しました");
      console.log("➡️ home.html へ遷移します");
      window.location.href = "./home.html"; // 相対パスで明示
    } catch (error) {
      console.error("❌ Firestoreへの記録失敗:", error);
    }
  });

  // 編集ボタン（管理者のみ）
  editVersionBtn.addEventListener("click", () => {
    alert("バージョン編集画面へ遷移します（管理者専用）");
    // window.location.href = "version-edit.html";
  });

  // UIリセット
  function resetUI() {
    loginBtn.classList.remove("active");
    loginBtn.disabled = true;
    loginBtn.dataset.userId = "";
    loginBtn.dataset.userName = "";
    loginBtn.dataset.userRole = "";
    loginBtn.dataset.userUid = "";
    editVersionBtn.classList.add("hidden");
  }
});