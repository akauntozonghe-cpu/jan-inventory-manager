import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const auth = getAuth();

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

// ログイン状態監視
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("ログインしていません。");
    return;
  }

  const uid = user.uid;
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(query(usersRef, where("uid", "==", uid)));

  if (snapshot.empty) {
    alert("ユーザー情報が見つかりません。");
    return;
  }

  let userData;
  snapshot.forEach(doc => {
    userData = doc.data();
  });

  const { id, name, role, canDecideAI } = userData;

  // ユーザー情報表示
  document.getElementById("userName").textContent = name;
  document.getElementById("userRole").textContent = role;
  document.getElementById("userId").textContent = id;
  document.getElementById("userInfoHeader").textContent =
    `🛡️ 責任者：${name}（${id}）｜権限：${role}`;

  if (role === "管理者") {
    document.querySelector(".admin-only").classList.remove("hidden");
    document.getElementById("adminBanner").textContent = "👑 管理者モード中";
    document.body.classList.add("admin-mode");
  }

  // リアルタイム監視開始
  watchInventory(uid);
  watchAISuggestions(uid);
  watchActionLogs(uid);
  displayPhilosophyMessage();
});

// 在庫状況監視
function watchInventory(uid) {
  const itemsRef = collection(db, "items");
  onSnapshot(itemsRef, (snapshot) => {
    let total = 0, warning = 0, expired = 0;
    const now = new Date();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.registeredBy === uid) {
        total++;
        if (data.status === "警告") warning++;
        if (new Date(data.deadline) < now) expired++;
      }
    });
    document.getElementById("totalItems").textContent = total;
    document.getElementById("warningItems").textContent = warning;
    document.getElementById("expiredItems").textContent = expired;
  });

  // 緊急情報
  onSnapshot(itemsRef, (snapshot) => {
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
  });
}

// AI提案履歴監視
function watchAISuggestions(uid) {
  const aiRef = collection(db, "aiSuggestions");
  onSnapshot(query(aiRef, where("decidedBy", "==", uid)), (snapshot) => {
    const list = document.getElementById("historyList");
    list.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const time = data.decidedAt.toDate().toLocaleString("ja-JP");
      const li = document.createElement("li");
      li.textContent = `提案 ${data.suggestionId} を「${data.status}」として判断（${time}）`;
      list.appendChild(li);
    });
  });
}

// 最後の操作監視
function watchActionLogs(uid) {
  const logsRef = collection(db, "actionLogs");
  onSnapshot(query(logsRef, where("performedBy", "==", uid)), (snapshot) => {
    let latest = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!latest || data.timestamp.toDate() > latest.timestamp.toDate()) {
        latest = data;
      }
    });
    const lastAction = latest
      ? `${latest.action}（${latest.timestamp.toDate().toLocaleString("ja-JP")}）`
      : "記録なし";
    document.getElementById("lastAction").textContent = lastAction;
  });
}

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