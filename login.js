import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

const userCodeInput = document.getElementById("userCode");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");
const editVersionBtn = document.getElementById("editVersionBtn");
const welcomeMessage = document.querySelector(".welcome-message");

const adminIds = ["2488", "1011"];

const messages = [
  "この空間は、あなたの責任と誇りを表現する場です。",
  "あなたの判断が、この空間の未来を形作ります。",
  "この場は、あなたの痕跡が意味を持つ場所です。",
  "責任者としてのあなたの意志が、すべての動きを導きます。",
  "この空間は、あなたの選択が記録される舞台です。",
  "あなたの役割は、ただの操作ではなく、思想の実行です。",
  "この場に宿る者として、あなたの誇りが空気を変えます。",
  "この空間は、あなたの存在が意味を持つよう設計されています。",
  "あなたの入場は、空間の記憶に刻まれます。",
  "この空間は、あなたの責任が可視化される場所です。"
];

function setRandomMessage() {
  const index = Math.floor(Math.random() * messages.length);
  welcomeMessage.textContent = messages[index];
}
window.addEventListener("DOMContentLoaded", setRandomMessage);

userCodeInput.addEventListener("input", async () => {
  const inputId = userCodeInput.value.trim();
  if (!inputId) {
    resetUI();
    return;
  }

  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);

  let matchedUser = null;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.id === inputId) {
            matchedUser = { ...data, docId: doc.id };
    }
  });

  if (matchedUser) {
    const { name, role, id } = matchedUser;
    userInfo.textContent = `ようこそ、${name} さん（${role}）──この空間はあなたの判断で動きます。`;
    userInfo.classList.remove("hidden");
    loginBtn.classList.add("active");
    loginBtn.disabled = false;

    loginBtn.dataset.userId = id;
    loginBtn.dataset.userName = name;
    loginBtn.dataset.userRole = role;

    if (adminIds.includes(id)) {
      editVersionBtn.classList.remove("hidden");
    } else {
      editVersionBtn.classList.add("hidden");
    }
  } else {
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

  const logRef = collection(db, "loginLogs");
  const logData = { id, name, role, timestamp, version, device };

  try {
    await addDoc(logRef, logData);
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