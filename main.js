import { db } from "./firebase.js";
import { collection, query, orderBy, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
  if (target.startsWith("uid:") && target.slice(4) === user.uid) return true;
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

// 初期化時に呼び出す
// initNotificationListener(currentUser);