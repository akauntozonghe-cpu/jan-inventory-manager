import {
  getFirestore, collection, query, where, onSnapshot,
  doc, updateDoc, getDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

/* ===============================
   承認処理
================================ */
async function handleApprove(req) {
  const itemRef = doc(db, "items", req.targetItem);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) return;

  // items を更新（既存データを保持しつつ変更を適用）
  await updateDoc(itemRef, {
    ...req.changes,
    updatedAt: serverTimestamp()
  });

  // editRequests を更新
  await updateDoc(doc(db, "editRequests", req.id), {
    status: "承認",
    processedAt: serverTimestamp(),
    processedBy: auth.currentUser.uid
  });

  // 履歴に記録
  await addDoc(collection(db, "history"), {
    type: "変更承認",
    actor: auth.currentUser.uid,
    targetItem: req.targetItem,
    changes: req.changes,
    timestamp: serverTimestamp()
  });

  // 申請者に通知（任意）
  await addDoc(collection(db, "notificationLogs"), {
    title: "申請承認",
    body: `あなたの申請が承認されました（対象: ${req.targetItem}）`,
    type: "info",
    target: `uid:${req.requestedByUid}`, // 申請者UIDを保存しておく必要あり
    createdAt: serverTimestamp()
  });
}

/* ===============================
   却下処理
================================ */
async function handleReject(req) {
  await updateDoc(doc(db, "editRequests", req.id), {
    status: "却下",
    processedAt: serverTimestamp(),
    processedBy: auth.currentUser.uid
  });

  // 履歴に記録
  await addDoc(collection(db, "history"), {
    type: "変更却下",
    actor: auth.currentUser.uid,
    targetItem: req.targetItem,
    changes: req.changes,
    timestamp: serverTimestamp()
  });

  // 申請者に通知（任意）
  await addDoc(collection(db, "notificationLogs"), {
    title: "申請却下",
    body: `あなたの申請は却下されました（対象: ${req.targetItem}）`,
    type: "warning",
    target: `uid:${req.requestedByUid}`,
    createdAt: serverTimestamp()
  });
}

/* ===============================
   リクエスト描画
================================ */
function renderRequests(requests) {
  const container = document.getElementById("requestList");
  container.innerHTML = "";

  if (requests.length === 0) {
    container.innerHTML = "<p>申請はありません。</p>";
    return;
  }

  requests.forEach(req => {
    const div = document.createElement("div");
    div.className = "requestCard";
    div.innerHTML = `
      <p>対象: ${req.targetItem}</p>
      <p>申請者: ${req.requestedBy}</p>
      <pre>${JSON.stringify(req.changes, null, 2)}</pre>
      <p>状態: ${req.status}</p>
    `;

    if (req.status === "未処理") {
      const approveBtn = document.createElement("button");
      approveBtn.textContent = "承認";
      approveBtn.onclick = () => handleApprove(req);

      const rejectBtn = document.createElement("button");
      rejectBtn.textContent = "却下";
      rejectBtn.onclick = () => handleReject(req);

      div.appendChild(approveBtn);
      div.appendChild(rejectBtn);
    }

    container.appendChild(div);
  });
}

/* ===============================
   初期化
================================ */
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    // Firestore からユーザー情報を取得して管理者か確認
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().role !== "管理者") {
      document.getElementById("requestList").innerHTML = "<p>権限がありません。</p>";
      return;
    }

    // 管理者のみ購読
    const q = query(collection(db, "editRequests"), where("status", "==", "未処理"));
    onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderRequests(requests);
    });
  });
});