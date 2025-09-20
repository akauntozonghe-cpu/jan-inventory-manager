import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// ✅ 管理者のみアクセス許可
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("ログインが必要です");
    window.location.href = "index.html";
    return;
  }

  const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
  const role = userDoc.docs[0]?.data()?.role || "未設定";

  if (role !== "管理者") {
    alert("管理者のみアクセス可能です");
    window.location.href = "dashboard.html";
    return;
  }

  loadPendingItems(); // ✅ 保留一覧表示
  loadHistory();      // ✅ 履歴表示
  setupNotificationForm(user); // ✅ 通知送信フォーム
});

// ✅ 保留一覧表示
async function loadPendingItems() {
  const q = query(collection(db, "items"), where("status", "==", "保留"));
  const snapshot = await getDocs(q);
  const container = document.getElementById("pendingItemsContainer");
  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const item = docSnap.data();
    const div = document.createElement("div");
    div.className = "pendingCard";
    div.innerHTML = `
      <strong>${item.name}</strong><br>
      JAN: ${item.jan}<br>
      数量: ${item.quantity} ${item.unit}<br>
      登録者: ${item.createdBy}<br>
      <button onclick="approveItem('${docSnap.id}', '${item.name}')">✅ 承認</button>
    `;
    container.appendChild(div);
  });
}

// ✅ 承認処理
window.approveItem = async (itemId, itemName) => {
  const user = auth.currentUser;
  await updateDoc(doc(db, "items", itemId), {
    status: "承認済",
    approvedAt: serverTimestamp(),
    approvedBy: user.uid
  });

  await addDoc(collection(db, "history"), {
    type: "承認",
    actor: user.uid,
    targetItem: itemId,
    timestamp: serverTimestamp(),
    details: { status: "承認済", name: itemName }
  });

  alert("承認しました");
  loadPendingItems();
  loadHistory();
};

// ✅ 履歴表示
async function loadHistory() {
  const q = query(
    collection(db, "history"),
    orderBy("timestamp", "desc"),
    limit(20)
  );
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

// ✅ 通知送信フォーム処理
function setupNotificationForm(user) {
  const form = document.getElementById("sendNotificationForm");
  if (!form) {
    console.warn("通知フォームが見つかりません");
    return;
  }

  console.log("通知フォーム初期化OK");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleEl = document.getElementById("notifTitle");
    const bodyEl = document.getElementById("notifBody");
    const targetEl = document.getElementById("notifTarget");

    const title = titleEl?.value.trim();
    const body = bodyEl?.value.trim();
    const target = targetEl?.value;

    console.log("送信データ確認:", { title, body, target });

    if (!title || !body) {
      alert("タイトルと本文を入力してください");
      return;
    }

    try {
      await addDoc(collection(db, "notificationLogs"), {
        title,
        body,
        target,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      console.log("Firestore 書き込み成功");
      alert("通知を送信しました");
      form.reset();
    } catch (err) {
      console.error("通知送信エラー:", err);
      alert("通知送信に失敗しました");
    }
  });
}