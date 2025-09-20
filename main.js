// main.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ✅ ログイン状態監視
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  console.log("ログイン中:", user.uid);

  // 通知リスナー開始
  initNotificationListener(user);
});

// ✅ 通知受信処理
let notifications = [];

function initNotificationListener(currentUser) {
  const q = query(collection(db, "notificationLogs"), orderBy("createdAt", "desc"));
  onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const data = change.doc.data();
        console.log("通知受信:", data);

        if (isTargetUser(data.target, currentUser)) {
          addToHeaderNotifications(data.title, data.body);
        }
      }
    });
  });
}

function isTargetUser(target, user) {
  if (target === "all") return true;
  if (target === "admin" && user.role === "管理者") return true;
  if (target?.startsWith("uid:") && target.slice(4) === user.uid) return true;
  return false;
}

function addToHeaderNotifications(title, body) {
  notifications.unshift({ title, body, time: new Date() });
  if (notifications.length > 20) notifications.pop();

  document.getElementById("notificationCount").textContent = notifications.length;

  const listEl = document.getElementById("notificationList");
  listEl.innerHTML = notifications.map(n =>
    `<li style="border-bottom:1px solid #eee; padding:5px;">
      <strong>${n.title}</strong><br>${n.body}<br>
      <small>${n.time.toLocaleString("ja-JP")}</small>
    </li>`
  ).join("");
}

// 🔔 アイコンクリックで開閉
document.getElementById("notificationBell").addEventListener("click", () => {
  const dropdown = document.getElementById("notificationDropdown");
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
});