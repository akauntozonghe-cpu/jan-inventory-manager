import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// 🧭 UID確認と起動
const uid = localStorage.getItem("uid");
if (!uid) {
  setTimeout(() => window.location.href = "index.html", 2000);
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

// 🕰️ 現在時刻（秒単位）
function startClock() {
  setInterval(() => {
    const now = new Date();
    const date = now.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short"
    });
    const time = now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const el = document.getElementById("clock");
    if (el) el.textContent = `⏱ ${date} ${time}`;
  }, 1000);
}

const raw = loginSnap.docs[0].data().timestamp;

let last;
if (raw instanceof Date) {
  last = raw;
} else if (typeof raw.toDate === "function") {
  last = raw.toDate();
} else if (typeof raw._seconds === "number") {
  last = new Date(raw._seconds * 1000);
} else {
  last = new Date(raw); // 最終手段
}

const formatted = last.toLocaleString("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

document.getElementById("lastJudgment").textContent = `🕒 最終判断：${formatted}`;
// 👤 ユーザー情報と判断履歴
async function loadUserInfo(uid) {
  const userQuery = query(collection(db, "users"), where("uid", "==", uid));
  const userSnap = await getDocs(userQuery);
  if (!userSnap.empty) {
    const user = userSnap.docs[0].data();
    const el = document.getElementById("responsibleUser");
    if (el) {
      el.textContent = `${user.name}（${user.role}）`;
      renderBadge(user.role);
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
    const last = loginSnap.docs[0].data().timestamp.toDate();
    const el = document.getElementById("lastJudgment");
    if (el) el.textContent = `🕒 最終判断：${last.toLocaleTimeString("ja-JP", { hour12: false })}`;
    showLoginRitual(last);
  }
}

// ✨ ログイン儀式
function showLoginRitual(lastTimestamp) {
  const now = Date.now();
  const diffMs = now - lastTimestamp.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const message = `前回の判断から ${diffHours} 時間が経過しました`;
  const html = `
    <div style="text-align:center; padding:1em; background:#fefefe; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.1); margin-bottom:1em;">
      <img src="icon-192.png" width="64" height="64" style="margin-bottom:0.5em;" />
      <p style="font-weight:bold; font-size:1.1em;">ようこそ、秩序の守護者。</p>
      <p style="color:#333;">${message}</p>
    </div>`;
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.prepend(container);
}

// 👑 称号バッジ
function renderBadge(role) {
  const badge = {
    "管理者": "👑",
    "責任者": "🧑‍💼",
    "担当者": "📦"
  };
  const el = document.getElementById("responsibleUser");
  if (el) el.innerHTML = `${badge[role] || ""} ${el.textContent}`;
}

// 🚪 ログアウト
window.logout = function () {
  localStorage.removeItem("uid");
  sessionStorage.removeItem("temporaryAdmin");
  window.location.href = "index.html";
};

// 🍔 メニュー展開
window.toggleMenu = function expandMenu(target) {
  const menuDetails = {
    register: { label: "商品登録", desc: "新しい商品を登録します" },
    list: { label: "商品一覧", desc: "現在の在庫を確認します" },
    market: { label: "フリマ", desc: "出品・売却情報を管理します" },
    report: { label: "報告", desc: "在庫や売上の報告を行います" },
    admin: { label: "管理者", desc: "システム設定と権限管理" },
    settings: { label: "設定", desc: "表示や通知の調整" }
  };

  const info = menuDetails[target];
  const html = `
    <div class="menu-expanded">
      <h3>🧭 ${info.label}</h3>
      <p>${info.desc}</p>
      <button onclick="goToPage('${target}')">この操作を開始</button>
    </div>`;
  document.getElementById("menuDetail").innerHTML = html;
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

// ⏳ 緊急アイテム
function loadUrgentItems() {
  const el = document.getElementById("urgentItems");
  if (el) {
    el.innerHTML = `
      <h3>⏳ 期限の近いもの</h3>
      <div class="summary-card">商品B（本日）</div>
      <div class="summary-card">商品C（あと1日）</div>`;
  }
}

// 📅 カレンダー情報
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

// 🤖 AIサマリー
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

// 📊 AI在庫提案
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

// 🛒 フリマ情報
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

// 🧠 AI判断履歴
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
      const time = new Date(d.timestamp.seconds * 1000).toLocaleTimeString("ja-JP", { hour12: false });
      el.innerHTML += `<div class="summary-card">${d.message}（${time}）</div>`;
    });
  }
}

// 🧑‍💼 一時介入判定（インデックス必要）
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
      const banner = document.getElementById("adminModeBanner");
      if (banner) banner.style.display = "block";
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
window.goToPage = function (target) {
  window.location.href = `${target}.html`;
};