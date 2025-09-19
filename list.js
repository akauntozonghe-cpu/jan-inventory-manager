import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

// ✅ 商品一覧の表示（承認済のみ）
function renderItemList(items) {
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
      <h3>${item.name}</h3>
      <p>数量: ${item.quantity} ${item.unit}</p>
      <p>場所: ${item.location}</p>
      <p>管理ID: ${item.controlId}</p>
    `;
    container.appendChild(div);
  });
}

// ✅ Firestoreから承認済み商品を取得
document.addEventListener("DOMContentLoaded", () => {
  const q = query(
    collection(db, "items"),
    where("status", "==", "承認済")
  );

  onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data());
    renderItemList(items);
  });
});