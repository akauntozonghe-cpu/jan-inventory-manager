import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  addDoc
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

// ユーザー情報（仮：IDは固定）
const userId = "RM-001";
let userRole = "責任者";
let canDecideAI = false;

// ユーザー情報読み込み
async function loadUserInfo() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(query(usersRef, where("id", "==", userId)));

  snapshot.forEach(doc => {
    const data = doc.data();
    userRole = data.role;
    canDecideAI = data.canDecideAI || false;

    document.getElementById("userName").textContent = data.name;
    document.getElementById("userRole").textContent = data.role;
    document.getElementById("userId").textContent = data.id;
    document.getElementById("userInfoHeader").textContent =
      `🛡️ 責任者：${data.name}（${data.id}）｜権限：${data.role}`;

    if (data.role === "管理者") {
      document.querySelector(".admin-only").classList.remove("hidden");
      enableAdminMode();
    }
  });
}
loadUserInfo();

// 管理者モード演出
function enableAdminMode() {
  document.getElementById("adminBanner").textContent = "👑 管理者モード中";
  document.body.classList.add("admin-mode");
}

// 時計表示
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

// ハンバーガー開閉
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  document.getElementById("hamburgerMenu").classList.toggle("hidden");
});

// 在庫状況集計
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

// 緊急情報抽出
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

// AI提案生成
function generateAISuggestions() {
  const container = document.getElementById("aiSuggestions");
  container.innerHTML = "";

  const suggestions = userRole === "管理者"
    ? [
        { msg: "承認待ちの申請が5件あります。処理を促してください。", id: "sug001" },
        { msg: "期限切れの在庫が7件あります。責任者に通知してください。", id: "sug002" }
      ]
    : [
        { msg: "あなたの登録した在庫に期限切れがあります。", id: "sug101" },
        { msg: "次の予定は明日10:00の承認です。", id: "sug102" }
      ];

  suggestions.forEach(s => renderAISuggestion(s.msg, s.id));
}

function renderAISuggestion(msg, suggestionId) {
  const container = document.getElementById("aiSuggestions");
  const wrapper = document.createElement("div");
  wrapper.classList.add("ai-item");

  const p = document.createElement("p");
  p.textContent = `🤖 ${msg}`;
  wrapper.appendChild(p);

  if (userRole === "管理者" || canDecideAI) {
    const applyBtn = document.createElement("button");
    applyBtn.textContent = "適用";
    applyBtn.onclick = () => handleDecision(suggestionId, "適用");
    wrapper.appendChild(applyBtn);

    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = "却下";
    rejectBtn.onclick = () => handleDecision(suggestionId, "却下");
    wrapper.appendChild(rejectBtn);
  }

  container.appendChild(wrapper);
}

async function handleDecision(id, result) {
  await addDoc(collection(db, "aiSuggestions"), {
    suggestionId: id,
    status: result,
    decidedBy: userId,
    decidedAt: new Date()
  });
  alert(`提案を「${result}」として記録しました`);
}
generateAISuggestions();

// JANコード即応
async function handleJANScan(janCode) {
  const snapshot = await getDocs(query(collection(db, "items"), where("jan", "==", janCode)));
  if (snapshot.empty) {
    alert(`JANコード ${janCode} に一致する商品がありません。新規登録しますか？`);
  } else {
    snapshot.forEach(doc => {
      const data = doc.data();
      alert(`商品名：${data.name}｜期限：${data.deadline}`);
      generateAISuggestionsForJAN(data);
    });
  }
}

function generateAISuggestionsForJAN(item) {
  const container = document.getElementById("aiSuggestions");
  container.innerHTML = `
    <p>🤖 商品「${item.name}」は期限が近いです。処理しますか？</p>
    <p>🤖 この商品は平均¥1,280で取引されています。出品しますか？</p>
  `;
}

// QRコード即応
async function handleQRScan(qrData) {
  if (qrData.startsWith("item:")) {
    const itemId = qrData.replace("item:", "");
    const itemSnap = await getDoc(doc(db, "items", itemId));
    if (itemSnap.exists()) {
      const data = itemSnap.data();
      alert(`商品名：${data.name}｜期限：${data.deadline}`);
    }
  } else if (qrData.startsWith("link:")) {
    window.open(qrData.replace("link:", ""), "_blank");
  } else {
    alert("QRコードの形式が認識できません。");
  }
}

// カレンダー設定
document.getElementById("calendarView").addEventListener("change", (e) => {
  const view = e.target.value;
  document.getElementById("calendarContent").innerHTML =
    `📅 ${view}ビューで予定を表示中（仮）`;
});

// 思想メッセージ
function displayPhilosophyMessage() {
  const messages = [
    "あなたの痕跡が空間の質を高めています。",
    "この操作は、秩序と誇りの一部です。",
    "空間は、あなたの判断を記憶します。",
    "責任は、見える形で残されます。",
    "この瞬間が、空間の未来を形づくります。"
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById("philosophyMessage").textContent = msg;
}
displayPhilosophyMessage();

// 🧑‍💼 責任者の痕跡表示
async function loadUserTrace() {
  const itemsRef = collection(db, "items");
  const aiRef = collection(db, "aiSuggestions");
  const logsRef = collection(db, "actionLogs");

  const itemSnap = await getDocs(query(itemsRef, where("registeredBy", "==", userId)));
  const aiSnap = await getDocs(query(aiRef, where("decidedBy", "==", userId)));
  const logSnap = await getDocs(query(logsRef, where("performedBy", "==", userId)));

  document.getElementById("registeredCount").textContent = itemSnap.size;
  document.getElementById("aiDecisions").textContent = aiSnap.size;

  let lastAction = "記録なし";
  let latest = null;
  logSnap.forEach(doc => {
    const data = doc.data();
    if (!latest || data.timestamp.toDate() > latest.timestamp.toDate()) {
      latest = data;
    }
  });
  if (latest) {
    lastAction = `${latest.action}（${latest.timestamp.toDate().toLocaleString("ja-JP")}）`;
  }
  document.getElementById("lastAction").textContent = lastAction;
}
loadUserTrace();

// 📊 空間の状態表示
async function loadSpaceStatus() {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);

  let total = 0, expired = 0, pending = 0, warning = 0;
  const now = new Date();

  snapshot.forEach(doc => {
    const data = doc.data();
    total++;
    const deadline = new Date(data.deadline);
    if (deadline < now) expired++;
    if (data.status === "未承認") pending++;
    if (data.status === "警告") warning++;
  });

  document.getElementById("totalItems").textContent = total;
  document.getElementById("expiredItems").textContent = expired;
  document.getElementById("pendingApprovals").textContent = pending;
  document.getElementById("warningItems").textContent = warning;
}
loadSpaceStatus();

// 📜 判断履歴表示
async function loadDecisionHistory() {
  const aiRef = collection(db, "aiSuggestions");
  const snapshot = await getDocs(query(aiRef, where("decidedBy", "==", userId)));
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const time = data.decidedAt.toDate().toLocaleString("ja-JP");
    const li = document.createElement("li");
    li.textContent = `提案 ${data.suggestionId} を「${data.status}」として判断（${time}）`;
    list.appendChild(li);
  });
}
loadDecisionHistory();

// 🛍️ フリマ連携情報表示（仮）
function loadMarketInfo() {
  document.getElementById("listedItems").textContent = "5";
  document.getElementById("soldItems").textContent = "2";
  document.getElementById("avgPrice").textContent = "1280";
}
loadMarketInfo();
   