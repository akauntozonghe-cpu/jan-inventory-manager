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

// 🕰️ 秒単位の時計（空間の鼓動）
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("clock").textContent =
      now.toLocaleTimeString("ja-JP", { hour12: false });
  }, 1000);
}

// 👤 ユーザー情報とログイン履歴の読み込み
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

// 🧭 ページ遷移（空間が導く）
function goToPage(target) {
  window.location.href = `${target}.html`;
}

// 🚪 ログアウト（痕跡を閉じる）
function logout() {
  localStorage.removeItem("uid");
  sessionStorage.removeItem("temporaryAdmin");
  window.location.href = "index.html";
}

// 🍔 ハンバーガーメニュー展開
function toggleMenu() {
  const menu = document.getElementById("mainMenu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

// 📦 在庫状況（ダミー表示）
function loadInventoryStatus() {
  document.getElementById("inventoryStatus").innerHTML = `
    <div class="summary-card">期限切れ：商品C</div>
    <div class="summary-card">不足：商品A</div>`;
}

function loadUrgentItems() {
  document.getElementById("urgentItems").innerHTML = `
    <div class="summary-card">商品B（本日）</div>
    <div class="summary-card">商品C（あと1日）</div>`;
}

function loadCalendarInfo() {
  document.getElementById("calendarInfo").innerHTML = `
    <div class="summary-card">期限（14:00〜）</div>
    <div class="summary-card">商品登録（16:00）</div>
    <div class="summary-card">商品一覧更新（明日）</div>
    <div class="summary-card">フリマ更新（当日）</div>`;
}

function loadAISummary(uid) {
  document.getElementById("aiSummary").innerHTML = `
    <div class="summary-card">商品B「在庫が必要です」</div>
    <div class="summary-card">商品C「期限が迫る（9/14）」</div>
    <div class="summary-card">商品A「不足の可能性」</div>`;
}

function loadAIInventorySuggestions() {
  document.getElementById("aiInventorySuggestions").innerHTML = `
    <div class="summary-card">商品A：過剰 → 出品または値下げ</div>
    <div class="summary-card">商品B：在庫切れ → 発注候補</div>
    <div class="summary-card">商品C：滞留 → 廃棄または再販</div>
    <div class="summary-card">商品D：不足予測 → 補充提案</div>`;
}

function loadMarketInfo() {
  document.getElementById("marketInfo").innerHTML = `
    <div class="summary-card">出品中：商品K（¥1200）</div>
    <div class="summary-card">期限切れ：商品L</div>
    <div class="summary-card">売却済み：商品M（9/13）</div>`;
}

// 👑 一時介入判定（秩序の守護者）
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

// 🔓 管理者機能の一時解放
function enableAdminFeaturesTemporarily() {
  const isTempAdmin = sessionStorage.getItem("temporaryAdmin") === "true";
  if (isTempAdmin) {
    document.getElementById("settingsPanel").style.display = "block";
    document.getElementById("adminPanel").style.display = "block";
  }
}