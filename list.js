import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ✅ 商品一覧の表示
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
      <h3>${item.name}</h3>
      <p>数量: ${item.quantity} ${item.unit}</p>
      <p>場所: ${item.location}</p>
      <p>管理ID: ${item.controlId}</p>
      <p>状態: ${item.status}</p>
    `;

    // 管理者だけ承認ボタンを表示（保留のとき）
    if (isAdmin && item.status === "保留") {
      const btn = document.createElement("button");
      btn.textContent = "承認";
      btn.onclick = async () => {
        await updateDoc(doc(db, "items", item.id), {
          status: "承認済",
          updatedAt: serverTimestamp()
        });
        await addHistory(item.id, item.name);
      };
      div.appendChild(btn);
    }

    container.appendChild(div);
  });
}

// ✅ 履歴に残す
async function addHistory(itemId, name) {
  await addDoc(collection(db, "history"), {
    type: "承認",
    targetItem: itemId,
    details: { name },
    timestamp: serverTimestamp()
  });
}

// ✅ Firestoreから商品を取得
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    let isAdmin = false;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      isAdmin = userDoc.exists() && userDoc.data().role === "管理者";
    }

    const q = isAdmin
      ? query(collection(db, "items")) // 管理者は全部見る
      : query(collection(db, "items"), where("status", "==", "承認済"));

    onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      renderItemList(items, isAdmin);
    });
  });
});