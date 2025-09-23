// list.js
import { db, auth } from "./firebase.js";  // ← firebase.js から初期化済みの db/auth を利用

import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let allItems = [];
let currentFilter = "承認済";
let currentSort = "createdAt";

// ✅ 商品一覧の描画
function renderItemList(items, isAdmin) {
  const container = document.getElementById("itemListContainer");
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = "<p>表示できる商品がありません。</p>";
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "itemCard";
    div.innerHTML = `
      <h3>${item.name || item.商品名}</h3>
      <p>数量: ${item.quantity || item.数量} ${item.unit || item.単位}</p>
      <p>場所: ${item.location || item.保管場所}</p>
      <p>管理ID: ${item.controlId || item.管理番号}</p>
      <p>状態: ${item.status || item.状態}</p>
    `;

    const controls = document.createElement("div");
    controls.className = "controls";

    // 管理者操作
    if (isAdmin) {
      if (item.status === "保留") {
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "承認";
        approveBtn.onclick = () => approveItem(item.id, item);
        controls.appendChild(approveBtn);

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "却下";
        rejectBtn.onclick = () => rejectItem(item.id, item);
        controls.appendChild(rejectBtn);
      }
      if (item.status === "承認済") {
        const delBtn = document.createElement("button");
        delBtn.textContent = "削除(アーカイブ)";
        delBtn.onclick = () => archiveItem(item.id, item);
        controls.appendChild(delBtn);
      }
      if (item.status === "アーカイブ") {
        const restoreBtn = document.createElement("button");
        restoreBtn.textContent = "復元";
        restoreBtn.onclick = () => restoreItem(item.id, item);
        controls.appendChild(restoreBtn);
      }
    } else {
      // 責任者以下 → 変更請求
      if (item.status === "承認済") {
        const reqBtn = document.createElement("button");
        reqBtn.textContent = "変更請求";
        reqBtn.onclick = () => openChangeModal(item);
        controls.appendChild(reqBtn);
      }
    }

    div.appendChild(controls);
    container.appendChild(div);
  });
}

// ✅ 操作履歴
async function addHistory(itemId, name, type) {
  await addDoc(collection(db, "history"), {
    type,
    targetItem: itemId,
    details: { name },
    actor: auth.currentUser?.uid,
    timestamp: serverTimestamp()
  });
}

// ✅ 管理者操作
async function approveItem(id, data) {
  await updateDoc(doc(db, "items", id), {
    status: "承認済",
    approvedAt: serverTimestamp()
  });
  await addHistory(id, data.name, "承認");
}

async function rejectItem(id, data) {
  await updateDoc(doc(db, "items", id), {
    status: "却下",
    rejectedAt: serverTimestamp()
  });
  await addHistory(id, data.name, "却下");
}

async function archiveItem(id, data) {
  await updateDoc(doc(db, "items", id), {
    status: "アーカイブ",
    archivedAt: serverTimestamp()
  });
  await addHistory(id, data.name, "削除(アーカイブ)");
}

async function restoreItem(id, data) {
  await updateDoc(doc(db, "items", id), {
    status: "承認済",
    restoredAt: serverTimestamp()
  });
  await addHistory(id, data.name, "復元");
}

// ✅ 変更請求モーダルを開く
function openChangeModal(item) {
  const newQty = prompt("新しい数量を入力してください", item.quantity || item.数量);
  const newLoc = prompt("新しい保管場所を入力してください", item.location || item.保管場所);

  if (!newQty && !newLoc) return;

  requestChange(item.id, item, { quantity: newQty, location: newLoc });
}

// ✅ 責任者以下：変更請求
async function requestChange(id, data, changes) {
  await addDoc(collection(db, "changeRequests"), {
    itemId: id,
    requestedBy: auth.currentUser.uid,
    requestedAt: serverTimestamp(),
    changes,
    status: "未処理"
  });
  await addHistory(id, data.name, "変更請求");
  alert("変更請求を送信しました");
}

// ✅ 検索・フィルタ・ソート
function applyFilters() {
  let filtered = allItems;

  // フィルタ
  if (currentFilter) {
    filtered = filtered.filter(p => p.status === currentFilter);
  }

  // 検索
  const keyword = document.getElementById("searchInput")?.value.trim();
  if (keyword) {
    filtered = filtered.filter(p =>
      (p.jan || p.JANコード || "").includes(keyword) ||
      (p.name || p.商品名 || "").includes(keyword)
    );
  }

  // ソート
  if (currentSort === "expiry") {
    filtered.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
  } else if (currentSort === "quantity") {
    filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  } else {
    filtered.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }

  const isAdmin = sessionStorage.getItem("userRole") === "管理者";
  renderItemList(filtered, isAdmin);
}

// ✅ Firestore購読
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    let isAdmin = false;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      isAdmin = userDoc.exists() && userDoc.data().role === "管理者";
    }

    const q = query(collection(db, "items")); // 全部購読
    onSnapshot(q, (snapshot) => {
      allItems = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      applyFilters();
    });

    // フィルタタブイベント
    document.querySelectorAll(".filterBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;
        applyFilters();
      });
    });

    // ソート選択
    document.getElementById("sortSelect")?.addEventListener("change", (e) => {
      currentSort = e.target.value;
      applyFilters();
    });

    // 検索
    document.getElementById("searchBtn")?.addEventListener("click", applyFilters);

    // Enterキーでも検索できるようにする
    document.getElementById("searchInput")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyFilters();
      }
    });
  });
});