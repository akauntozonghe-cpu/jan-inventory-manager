import { db } from "./firebase.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Timestamp 正規化
function normalizeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") return new Date(ts);
  return null;
}

async function loadHistory() {
  const loginQ = query(collection(db, "loginLogs"), orderBy("timestamp", "desc"));
  const logoutQ = query(collection(db, "logoutLogs"), orderBy("timestamp", "desc"));

  const [loginSnap, logoutSnap] = await Promise.all([getDocs(loginQ), getDocs(logoutQ)]);

  const logs = [];

  loginSnap.forEach(doc => logs.push({ ...doc.data(), type: "login" }));
  logoutSnap.forEach(doc => logs.push({ ...doc.data(), type: "logout" }));

  // timestamp を JS Date に変換
  logs.forEach(log => {
    log.timestamp = normalizeTimestamp(log.timestamp);
  });

  // 並び替え（新しい順）
  logs.sort((a, b) => b.timestamp - a.timestamp);

  // 表示
  const listEl = document.getElementById("historyList");
  listEl.innerHTML = logs.map(log => {
    const date = log.timestamp ? log.timestamp.toLocaleString("ja-JP") : "不明";
    const icon = log.type === "login" ? "🟢" : "🔴";
    const cssClass = log.type === "login" ? "login" : "logout";
    return `<div class="log-entry ${cssClass}">${icon} ${date} - ${log.type} (${log.uid})</div>`;
  }).join("");
}

loadHistory();