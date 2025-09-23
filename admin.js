import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ===============================
   管理者のみアクセス許可
================================ */
(async () => {
  const uid = localStorage.getItem("uid");
  const role = localStorage.getItem("role");

  if (!uid) {
    alert("ログインが必要です");
    window.location.href = "index.html";
    return;
  }
  if (role !== "管理者") {
    alert("管理者のみアクセス可能です");
    window.location.href = "home.html";
    return;
  }

  // 初期表示
  await loadPendingItems();
  await loadHistory();
  setupNotificationForm(uid);
})();

/* ===============================
   保留一覧表示
================================ */
async function loadPendingItems() {
  const q = query(collection(db, "pendingItems"), where("status", "==", "保留"));
  const snapshot = await getDocs(q);
  const container = document.getElementById("pendingItemsContainer");
  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const item = docSnap.data();
    const div = document.createElement("div");
    div.className = "pendingCard";
    div.dataset.id = docSnap.id;
    div.innerHTML = `
      <label>
        <input type="checkbox" class="pending-check" value="${docSnap.id}">
        <strong>${item.name}</strong>
      </label><br>
      JAN: ${item.jan || "-"}<br>
      数量: ${item.quantity || 0} ${item.unit || ""}<br>
      登録者: ${item.createdByName || item.createdBy}<br>
      <button onclick="approveItem('${docSnap.id}', '${item.name}')">✅ 承認</button>
      <button onclick="rejectItem('${docSnap.id}', '${item.name}')">❌ 却下</button>
    `;
    container.appendChild(div);
  });

  // 一括承認ボタン
  if (snapshot.size > 0) {
    const bulkBtn = document.createElement("button");
    bulkBtn.textContent = "まとめて承認";
    bulkBtn.onclick = approveSelected;
    container.appendChild(bulkBtn);
  }
}

/* ===============================
   承認処理（個別）
================================ */
window.approveItem = async (pendingId, itemName) => {
  const uid = localStorage.getItem("uid");
  const card = document.querySelector(`[data-id="${pendingId}"]`);
  if (card) {
    card.classList.add("fade-out");
    card.addEventListener("animationend", () => card.remove());
  }

  try {
    const pendingRef = doc(db, "pendingItems", pendingId);
    const pendingSnap = await getDoc(pendingRef);
    if (!pendingSnap.exists()) return;
    const data = pendingSnap.data();

    // items に移動
    const newRef = await addDoc(collection(db, "items"), {
      ...data,
      status: "承認済",
      approvedAt: serverTimestamp(),
      approvedBy: uid
    });

    // pendingItems から削除
    await deleteDoc(pendingRef);

    // 履歴
    await addDoc(collection(db, "history"), {
      type: "承認",
      actor: uid,
      targetItem: newRef.id,
      timestamp: serverTimestamp(),
      details: { status: "承認済", name: itemName }
    });
  } catch (err) {
    console.error("承認処理エラー:", err);
    alert("承認に失敗しました");
  }
};

/* ===============================
   却下処理
================================ */
window.rejectItem = async (pendingId, itemName) => {
  const uid = localStorage.getItem("uid");
  const card = document.querySelector(`[data-id="${pendingId}"]`);
  if (card) {
    card.classList.add("fade-out");
    card.addEventListener("animationend", () => card.remove());
  }

  try {
    const pendingRef = doc(db, "pendingItems", pendingId);

    await updateDoc(pendingRef, {
      status: "却下",
      rejectedAt: serverTimestamp(),
      rejectedBy: uid
    });

    await addDoc(collection(db, "history"), {
      type: "却下",
      actor: uid,
      targetItem: pendingId,
      timestamp: serverTimestamp(),
      details: { status: "却下", name: itemName }
    });
  } catch (err) {
    console.error("却下処理エラー:", err);
    alert("却下に失敗しました");
  }
};

/* ===============================
   一括承認処理
================================ */
async function approveSelected() {
  const uid = localStorage.getItem("uid");
  const checks = document.querySelectorAll(".pending-check:checked");
  if (checks.length === 0) {
    alert("承認するアイテムを選択してください");
    return;
  }

  for (const c of checks) {
    await window.approveItem(c.value, "まとめ承認");
  }
  alert(`${checks.length}件を承認しました`);
}

/* ===============================
   履歴表示（タブ切替対応）
================================ */
async function loadHistory(filterType = null) {
  let q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(20));
  if (filterType) {
    q = query(
      collection(db, "history"),
      where("type", "==", filterType),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }

  const snapshot = await getDocs(q);
  const container = document.getElementById("historyContainer");
  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const log = docSnap.data();
    const time = log.timestamp?.toDate().toLocaleString("ja-JP") || "未取得";
    const div = document.createElement("div");
    div.className = "historyEntry";
    div.innerHTML = `
      <strong>${log.type}</strong><br>
      対象: ${log.details?.name || "不明"}<br>
      実行者: ${log.actor}<br>
      時刻: ${time}
    `;
    container.appendChild(div);
  });
}

/* ===============================
   通知送信フォーム処理
================================ */
function setupNotificationForm(uid) {
  const form = document.getElementById("sendNotificationForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("notifTitle")?.value.trim();
    const body = document.getElementById("notifBody")?.value.trim();
    const target = document.getElementById("notifTarget")?.value;
    const type = document.getElementById("notifType")?.value || "info";

    if (!title || !body) {
      alert("タイトルと本文を入力してください");
      return;
    }

    try {
      await addDoc(collection(db, "notificationLogs"), {
        title,
        body,
        target,
        type,
        createdAt: serverTimestamp(),
        createdBy: uid
      });
      alert("通知を送信しました");
      form.reset();
    } catch (err) {
      console.error("通知送信エラー:", err);
      alert("通知送信に失敗しました");
    }
  });
}