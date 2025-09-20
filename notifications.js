import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

async function approveItem(itemId, notifId, name) {
  const user = auth.currentUser;
  if (!user) {
    alert("ログインが必要です");
    return;
  }

  // items 更新
  await updateDoc(doc(db, "items", itemId), {
    status: "承認済",
    updatedAt: serverTimestamp()
  });

  // 通知を既読に
  await updateDoc(doc(db, "notifications", notifId), {
    status: "既読"
  });

  // 履歴に残す
  await addDoc(collection(db, "history"), {
    type: "承認",
    actor: user.uid,
    targetItem: itemId,
    timestamp: serverTimestamp(),
    details: { name }
  });

  alert("承認しました");
}

function renderNotifications(notifs, isAdmin) {
  const container = document.getElementById("notificationList");
  container.innerHTML = "";

  if (notifs.length === 0) {
    container.innerHTML = "<p>通知はありません。</p>";
    return;
  }

  notifs.forEach(n => {
    const div = document.createElement("div");
    div.className = "notificationCard";
    div.innerHTML = `
      <p>${n.message}</p>
      <small>${n.status}</small>
    `;

    if (isAdmin && n.status === "未読") {
      const btn = document.createElement("button");
      btn.textContent = "承認する";
      btn.onclick = () => approveItem(n.targetItem, n.id, n.message);
      div.appendChild(btn);
    }

    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    // 管理者かどうか確認
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === "管理者";

    const q = query(collection(db, "notifications"));
    onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderNotifications(notifs, isAdmin);
    });
  });
});