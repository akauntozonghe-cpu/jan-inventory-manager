import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

const uid = localStorage.getItem("uid");
const uidMessage = document.getElementById("uidMessage");

if (!uid) {
  uidMessage.textContent = "ログイン情報が見つかりません。入口へ戻ります。";
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);
} else {
  loadUserInfo(uid);
  loadInventoryStatus();
  loadUrgentItems();
  loadCalendarInfo();
  loadAISummary(uid);
  loadAIInventorySuggestions();
  loadMarketInfo();
  checkAdmin(uid);
  startClock();
}

function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("clock").textContent =
      now.toLocaleTimeString("ja-JP", { hour12: false });
  }, 1000);
}

async function loadUserInfo(uid) {
  const q = query(collection(db, "users"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const user = snapshot.docs[0].data();
    uidMessage.textContent = `責任者：${user.name}（${user.role}）｜UID: ${uid}`;
  }
}

function goHome() {
  window.location.href = "home.html";
}

function navigate(target) {
  window.location.href = `${target}.html`;
}

function logout() {
  localStorage.removeItem("uid");
  window.location.href = "index.html";
}

// 以下は各セクションの表示関数（ダミー構成）
function loadInventoryStatus() {
  document.getElementById("inventoryStatus").innerHTML = `
    <h3>📦 在庫状況</h3>
    <ul>
      <li class="danger">期限切れ：商品C</li>
      <li class="warning">過剰：商品B</li>
      <li class="warning">不足：商品A</li>
    </ul>`;
}

function loadUrgentItems() {
  document.getElementById("urgentItems").innerHTML = `
    <h3>⏳ 期限の近いもの</h3>
    <ul>
      <li>商品F（本日）</li>
      <li>商品E（あと1日）</li>
    </ul>`;
}

function loadCalendarInfo() {
  document.getElementById("calendarInfo").innerHTML = `
    <h3>📅 情報カレンダー</h3>
    <ul>
      <li>棚卸（14:00〜）</li>
      <li>AI提案確認（16:00）</li>
      <li>商品Gの期限（明日）</li>
      <li>フリマ更新（今週）</li>
    </ul>`;
}

function loadAISummary(uid) {
  document.getElementById("aiSummary").innerHTML = `
    <h3>🤖 多機能AI</h3>
    <ul>
      <li>未判断：商品H「在庫が過剰です」</li>
      <li>履歴：商品I「拒否済み（9/14）」</li>
      <li>予測：商品J「今週中に不足の可能性」</li>
    </ul>`;
}

function loadAIInventorySuggestions() {
  document.getElementById("aiInventorySuggestions").innerHTML = `
    <h3>🤖 AI提案（現在の在庫状況から）</h3>
    <ul>
      <li>商品A：過剰在庫（120個） → 出品または値下げを推奨</li>
      <li>商品B：在庫切れ → 発注候補として優先度「高」</li>
      <li>商品C：滞留在庫（30日間未動） → 廃棄または再販検討</li>
      <li>商品D：今週中に不足予測 → 補充提案</li>
    </ul>`;
}

function loadMarketInfo() {
  document.getElementById("marketInfo").innerHTML = `
    <h3>🛒 フリマ情報</h3>
    <ul>
      <li>出品中：商品K（¥1200）</li>
      <li class="danger">期限切れ：商品L</li>
      <li>売却済み：商品M（9/13）</li>
    </ul>`;
}

async function checkAdmin(uid) {
  const q = query(collection(db, "users"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const role = snapshot.docs[0].data().role;
    if (role === "管理者") {
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("settingsPanel").style.display = "block";
    } else {
      document.getElementById("settingsPanel").style.display = "block";
    }
  }
}