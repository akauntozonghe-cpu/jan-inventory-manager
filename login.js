// ✅ Firebaseモジュール最上位でインポート
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

// 🔧 Firebase初期化
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

window.addEventListener("DOMContentLoaded", () => {
  const userCodeInput = document.getElementById("userCodeInput"); // ✅ HTMLと一致
  const loginBtn = document.getElementById("loginBtn");
  const editVersionBtn = document.getElementById("editVersionBtn");
  const welcomeMessage = document.querySelector(".welcome-message");

  if (!userCodeInput || !loginBtn || !editVersionBtn || !welcomeMessage) {
    console.error("空間の入口要素が見つかりません。HTML構造を確認してください。");
    return;
  }

  // ⌨️ Enterキー対応（入力欄に限定）
  userCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !loginBtn.disabled) {
      loginBtn.click();
    }
  });

  // 🔍 入力監視（入力時にFirestore照合）
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

      // ✅ localStorage に保存（後続画面で利用）
      localStorage.setItem("uid", uid);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);

      welcomeMessage.textContent = `🛡️ ようこそ、${name} さん（${role}）──この空間はあなたの判断で動きます。`;

      // 管理者のみ編集ボタン表示
      editVersionBtn.classList.toggle("hidden", role !== "管理者");
    } catch (error) {
      console.error("❌ Firestore照合エラー:", error);
      resetUI();
    }
  });

  // 🚪 ログイン処理（クリック時にも再照合）
  loginBtn.addEventListener("click", async () => {
    const inputId = userCodeInput.value.trim();
    if (!inputId) return;

    try {
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

      // Firebase認証
      await setPersistence(auth, browserLocalPersistence);
      await signInAnonymously(auth);

      // Firestoreにログイン履歴を記録
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

      console.log("✅ ログイン履歴を記録しました");
      window.location.href = "./home.html";
    } catch (error) {
      console.error("❌ ログイン処理失敗:", error);
      alert("ログインに失敗しました");
    }
  });

  // ⚙️ 編集ボタン（管理者のみ）
  editVersionBtn.addEventListener("click", () => {
    alert("バージョン編集画面へ遷移します（管理者専用）");
    // window.location.href = "version-edit.html";
  });

  // 🔄 UIリセット
  function resetUI() {
    loginBtn.classList.remove("active");
    loginBtn.disabled = true;
    loginBtn.dataset.userId = "";
    loginBtn.dataset.userName = "";
    loginBtn.dataset.userRole = "";
    loginBtn.dataset.userUid = "";
    editVersionBtn.classList.add("hidden");
    welcomeMessage.textContent = "この空間は、あなたの責任と誇りを表現する場です。";
  }
});