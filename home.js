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
  loadAIDecisionHistory(uid);
  checkTemporaryAdmin(uid);
  startClock();
}

// 🕰️ 秒単位の時計
function startClock() {
  setInterval(() => {
    const now = new Date();
    const clockEl = document.getElementById("clock");
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString("ja-JP", { hour12: false });
    }
  }, 1000);
}

// 👤 ユーザー情報とログイン履歴
async function loadUserInfo(uid) {
  const userQuery = query(collection(db, "users"), where("uid", "==", uid));
  const userSnap = await getDocs(userQuery);
  if (!userSnap.empty) {
    const user = userSnap.docs[0].data();
    const role = user.role;
    const name = user.name;
    const el = document.getElementById("responsibleUser");
    if (el) {
      el.textContent = `責任者：${name}（${role}）`;
      renderBadge(role);
    }
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
    const el = document.getElementById("lastLogin");
    if (el) el.textContent = `最終ログイン：${last}`;
    showLoginRitual(last);
  }
}

// ✨ ログイン儀式の演出
function showLoginRitual(lastTimestamp) {
  const now = Date.now();
  const diffMs = now - new Date(lastTimestamp).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const message = `前回の判断から ${diffHours} 時間が経過しました`;
  alert(`ようこそ、秩序の守護者。\n${message}`);
}

// 👑 称号バッジ表示
function renderBadge(role) {
  const badge = {
    "管理者": "👑",
    "責任者": "🧑‍💼",
    "一般": "📦"
  };
  const el = document.getElementById("responsibleUser");
  if (el) el.innerHTML = `${badge[role] || ""} ${el.textContent}`;
}

// 🚪 ログアウト
function logout() {
  localStorage.removeItem("uid");
  sessionStorage.removeItem("temporaryAdmin");
  window.location.href = "index.html";
}

// 🍔 ハンバーガーメニュー
function toggleMenu() {
  const menu = document.getElementById("mainMenu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

// 📦 在庫状況
function loadInventoryStatus() {
  const el = document.getElementById("inventoryStatus");
  if (el) {
    el.innerHTML = `
      <h3>📦 在庫状況</h3>
      <div class="summary-card">期限切れ：商品C</div>
      <div class="summary-card">不足：商品A</div>`;
  }
}

function loadUrgentItems() {
  const el = document.getElementById("urgentItems");
  if (el) {
    el.innerHTML = `
      <h3>⏳ 期限の近いもの</h3>
      <div class="summary-card">商品B（本日）</div>
      <div class="summary-card">商品C（あと1日）</div>`;
  }
}

function loadCalendarInfo() {
  const el = document.getElementById("calendarInfo");
  if (el) {
    el.innerHTML = `
      <h3>📅 情報カレンダー</h3>
      <div class="summary-card">期限（14:00〜）</div>
      <div class="summary-card">商品登録（16:00）</div>
      <div class="summary-card">商品一覧更新（明日）</div>
      <div class="summary-card">フリマ更新（当日）</div>`;
  }
}

function loadAISummary(uid) {
  const el = document.getElementById("aiSummary");
  if (el) {
    el.innerHTML = `
      <h3>🤖 多機能AI</h3>
      <div class="summary-card">商品B「在庫が必要です」</div>
      <div class="summary-card">商品C「期限が迫る（9/14）」</div>
      <div class="summary-card">商品A「不足の可能性」</div>`;
  }
}

function loadAIInventorySuggestions() {
  const el = document.getElementById("aiInventorySuggestions");
  if (el) {
    el.innerHTML = `
      <h3>📊 AI在庫提案</h3>
      <div class="summary-card">商品A：過剰 → 出品または値下げ</div>
      <div class="summary-card">商品B：在庫切れ → 発注候補</div>
      <div class="summary-card">商品C：滞留 → 廃棄または再販</div>
      <div class="summary-card">商品D：不足予測 → 補充提案</div>`;
  }
}

function loadMarketInfo() {
  const el = document.getElementById("marketInfo");
  if (el) {
    el.innerHTML = `
      <h3>🛒 フリマ情報</h3>
      <div class="summary-card">出品中：商品K（¥1200）</div>
      <div class="summary-card">期限切れ：商品L</div>
      <div class="summary-card">売却済み：商品M（9/13）</div>`;
  }
}

// 🧠 AI判断履歴の表示
async function loadAIDecisionHistory(uid) {
  const q = query(
    collection(db, "aiDecisions"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(5)
  );
  const snap = await getDocs(q);
  const el = document.getElementById("aiHistory");
  if (el && !snap.empty) {
    el.innerHTML = "<h3>🧠 AI判断履歴</h3>";
    snap.forEach(doc => {
      const d = doc.data();
      el.innerHTML += `<div class="summary-card">${d.message}（${d.timestamp}）</div>`;
    });
  }
}

// 👑 一時介入判定
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
    const settingsPanel = document.getElementById("settingsPanel");
    const adminPanel = document.getElementById("adminPanel");
    if (settingsPanel) settingsPanel.style.display = "block";
    if (adminPanel) adminPanel.style.display = "block";
  }
}

// 🧭 ページ遷移（空間が導く）
function goToPage(target) {
  window.location.href = `${target}.html`;
}