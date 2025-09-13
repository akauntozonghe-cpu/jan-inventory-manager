// Firebase SDK モジュールの読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase 設定
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

// 初期化
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM取得
const userCodeInput = document.getElementById("userCode");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const editVersionBtn = document.getElementById("editVersionBtn");

// 管理者ID一覧（編集権限を限定）
const adminIds = ["AD-001", "AD-002"];

// 入力イベント：責任者ID照合
userCodeInput.addEventListener("input", async () => {
  const id = userCodeInput.value.trim();
  if (!id) {
    resetUI();
    return;
  }

  const userRef = ref(db, `users/${id}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      const name = user.name || "未定義";
      const role = user.role || "未定義";

      userInfo.textContent = `${name} さん（${role}）としてログインします。`;
      userInfo.classList.remove("hidden");
      loginBtn.classList.add("active");
      loginBtn.disabled = false;

      // 保持
      loginBtn.dataset.userId = id;
      loginBtn.dataset.userName = name;
      loginBtn.dataset.userRole = role;

      // 管理者なら編集ボタン表示
      if (adminIds.includes(id)) {
        editVersionBtn.classList.remove("hidden");
      } else {
        editVersionBtn.classList.add("hidden");
      }
    } else {
      resetUI();
    }
  } catch (error) {
    console.error("照合エラー:", error);
    resetUI();
  }
});

// Enterキー対応
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !loginBtn.disabled) {
    loginBtn.click();
  }
});

// ログイン処理＋履歴記録
loginBtn.addEventListener("click", async () => {
  const id = loginBtn.dataset.userId;
  const name = loginBtn.dataset.userName;
  const role = loginBtn.dataset.userRole;

  if (!id || !name || !role) return;

  const now = new Date();
  const timestamp = now.toISOString();
  const version = "v1.0.0";
  const device = `${navigator.platform} / ${navigator.userAgent}`;

  const logRef = ref(db, "loginLogs");
  const logData = {
    id,
    name,
    role,
    timestamp,
    version,
    device
  };

  try {
    await push(logRef, logData);
    console.log("ログイン履歴を記録しました");
  } catch (error) {
    console.error("ログイン履歴の記録に失敗:", error);
  }

  window.location.href = "home.html";
});

// 編集ボタン（管理者のみ）
editVersionBtn.addEventListener("click", () => {
  alert("バージョン編集画面へ遷移します（管理者専用）");
  // window.location.href = "version-edit.html";
});

// UIリセット
function resetUI() {
  userInfo.textContent = "";
  userInfo.classList.add("hidden");
  loginBtn.classList.remove("active");
  loginBtn.disabled = true;
  loginBtn.dataset.userId = "";
  loginBtn.dataset.userName = "";
  loginBtn.dataset.userRole = "";
  editVersionBtn.classList.add("hidden");
}