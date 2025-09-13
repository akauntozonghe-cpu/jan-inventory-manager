// Firebase SDK モジュールの読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.firebasestorage.app",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM 要素の取得
const userCodeInput = document.getElementById("userCode");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");

// 入力イベント：責任者番号の照合
userCodeInput.addEventListener("input", async () => {
  const code = userCodeInput.value.trim();
  if (!code) {
    resetUI();
    return;
  }

  const userRef = ref(db, `users/${code}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      userInfo.textContent = `${user.name} さん（${user.role}）としてログインします。`;
      userInfo.classList.remove("hidden");
      loginBtn.classList.add("active");
      loginBtn.disabled = false;
    } else {
      resetUI();
    }
  } catch (error) {
    console.error("照合エラー:", error);
    resetUI();
  }
});

// Enterキーでログイン可能に
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !loginBtn.disabled) {
    loginBtn.click();
  }
});

// ログインボタンのクリックイベント
loginBtn.addEventListener("click", () => {
  const code = userCodeInput.value.trim();
  if (code) {
    // 必要なら責任者情報をセッションに保存（後で拡張可能）
    // sessionStorage.setItem("userCode", code);
    window.location.href = "home.html";
  }
});

// UIリセット関数
function resetUI() {
  userInfo.textContent = "";
  userInfo.classList.add("hidden");
  loginBtn.classList.remove("active");
  loginBtn.disabled = true;
}