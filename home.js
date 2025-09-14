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

if (!uid) {
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
  checkTemporaryAdmin(uid);
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
  const userQuery = query(collection(db, "users"), where("uid", "==", uid));
  const userSnap = await getDocs(userQuery);
  if (!userSnap.empty) {
    const user = userSnap.docs[0].data();
    document.getElementById("responsibleUser").textContent =
      `責任者：${user.name}（${user.role}）`;
  }

  const loginQuery = query(
    collection(db, "loginLogs"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const loginSnap = await getDocs(loginQuery);
  if (!loginSnap.empty) {
    const last = loginSnap.docs[0].data().timestamp;
    document.getElementById("lastLogin").textContent =
      `最終ログイン：${last}`;
  }
}

function goHome() {
  window.location.href = "home.html";
}

function goToPage(target) {
  window.location.href = `${target}.html`;
}

function logout() {
  localStorage.removeItem("uid");
  sessionStorage.removeItem("temporaryAdmin");
  window.location.href = "index.html";
}

// 各セクションの表示関数（ダミー構成）

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

// 一時介入判定（30分以内の管理者操作があれば解放）

async function checkTemporaryAdmin(uid) {
  const q = query(
    collection(db, "interventionLogs"),
    where("targetUid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const last = snapshot.docs[0].data();
    const now = Date.now();
    const diff = now - new Date(last.timestamp).getTime();
    if (diff < 1000 * 60 * 30) {
      sessionStorage.setItem("temporaryAdmin", "true");
      document.getElementById("adminModeBanner").style.display = "block";
      enableAdminFeaturesTemporarily();
    }
  }
}

function enableAdminFeaturesTemporarily() {
  const isTempAdmin = sessionStorage.getItem("temporaryAdmin") === "true";
  if (isTempAdmin) {
    document.getElementById("settingsPanel").style.display = "block";
    document.getElementById("adminPanel").style.display = "block";
  }
}