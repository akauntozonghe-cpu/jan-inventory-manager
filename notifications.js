import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

async function approveItem(itemId, notifId, name) {
  const user = auth.currentUser;
  if (!user) return;

  // items 更新
  await updateDoc(doc(db, "items", itemId), {
    status: "承認済",
    updatedAt: serverTimestamp()
  });

  // 通知を更新
  await updateDoc(doc(db, "notifications", notifId), {
    status: "既読",
    result: "承認"
  });

  // 履歴に残す
  await addDoc(collection(db, "history"), {
    type: "承認",
    actor: user.uid,
    targetItem: itemId,
    timestamp: serverTimestamp(),
    details: { name }
  });
}

function renderNotifications(notifs, role) {
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
      <small>状態: ${n.result || "未処理"}</small>
    `;

    // 管理者だけ承認ボタンを表示
    if (role === "管理者" && n.result !== "承認") {
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

    // ユーザーの役割を取得
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.exists() ? userDoc.data().role : "未設定";

    // 管理者は全通知、責任者以下は自分の通知のみ
    const q = role === "管理者"
      ? query(collection(db, "notifications"))
      : query(collection(db, "notifications"), where("from", "==", user.uid));

    onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderNotifications(notifs, role);
    });
  });
});