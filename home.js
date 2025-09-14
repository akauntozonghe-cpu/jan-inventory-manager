import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
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

// ⏱️ リアルタイム日時
function updateClock() {
  const now = new Date();
  const formatted = now.toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    weekday: "short", timeZoneName: "short"
  });
  document.getElementById("clock").textContent = `⏱️ ${formatted}`;
}
setInterval(updateClock, 1000);
updateClock();

// ☰ ハンバーガー開閉
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  document.getElementById("hamburgerMenu").classList.toggle("hidden");
});

// 🧑‍💼 ユーザー情報（仮：IDは固定）
const userId = "RM-001"; // 実運用ではログイン時に渡す
async function loadUserInfo() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(query(usersRef, where("id", "==", userId)));

  snapshot.forEach(doc => {
    const data = doc.data();
    document.getElementById("userName").textContent = data.name;
    document.getElementById("userRole").textContent = data.role;
    document.getElementById("userId").textContent = data.id;
    document.getElementById("userInfoHeader").textContent =
      `🛡️ 責任者：${data.name}（${data.id}）｜権限：${data.role}`;
    if (data.role === "管理者") {
      document.querySelector(".admin-only").classList.remove("hidden");
    }
  });
}
loadUserInfo();

// ⏰ 緊急情報抽出
async function loadUrgentInfo() {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);
  const urgentList = document.getElementById("urgentList");
  urgentList.innerHTML = "";

  const now = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(now.getMonth() + 1);

  snapshot.forEach(doc => {
    const data = doc.data();
    const deadline = new Date(data.deadline);
    if (deadline < now) {
      urgentList.innerHTML += `<li>期限切れ：${data.name}（${data.deadline}）</li>`;
    } else if (deadline < oneMonthLater && data.status === "未承認") {
      urgentList.innerHTML += `<li>承認待ち：${data.name}（${data.deadline}）</li>`;
    }
  });
}
loadUrgentInfo();

// 📦 在庫状況
async function loadInventorySummary() {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);

  let total = 0, warning = 0, expired = 0;
  const now = new Date();

  snapshot.forEach(doc => {
    const data = doc.data();
    total++;
    if (data.status === "警告") warning++;
    if (new Date(data.deadline) < now) expired++;
  });

  document.getElementById("totalItems").textContent = total;
  document.getElementById("warningItems").textContent = warning;
  document.getElementById("expiredItems").textContent = expired;
}
loadInventorySummary();

// 🛍️ フリマ連携（仮）
document.getElementById("listedItems").textContent = "5";
document.getElementById("soldItems").textContent = "2";

// 🤖 AI提案
function generateAISuggestions() {
  const messages = [
    "期限切れの在庫が2件あります。処理しますか？",
    "次の予定は明日10:00の承認です。",
    "このJANコードの商品は平均¥1,200で取引されています。",
    "今月の操作件数：12件｜ログイン回数：5回",
    "商品一覧へ移動しますか？",
    "あなたの痕跡が空間の質を高めています。"
  ];
  const container = document.getElementById("aiSuggestions");
  container.innerHTML = "";
  messages.forEach(msg => {
    container.innerHTML += `<p>🤖 ${msg}</p>`;
  });
}
generateAISuggestions();

// 📅 カレンダー切替
document.getElementById("calendarView").addEventListener("change", (e) => {
  const view = e.target.value;
  document.getElementById("calendarContent").innerHTML =
    `📅 ${view}ビューで予定を表示中（仮）`;
});

// 📷 JANコード読み取り準備（拡張性確保）
async function prepareCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("カメラ準備完了（JANコード読み取り可能）");
    // 将来的にバーコードライブラリと連携
  } catch (err) {
    console.error("カメラ起動失敗:", err);
  }
}
// prepareCamera(); // 必要時に呼び出し