import {
  getFirestore, collection, query, where, onSnapshot,
  doc, updateDoc, getDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

async function handleApprove(req) {
  const itemRef = doc(db, "items", req.targetItem);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) return;

  // items を更新
  await updateDoc(itemRef, {
    ...req.changes,
    updatedAt: serverTimestamp()
  });

  // editRequests を更新
  await updateDoc(doc(db, "editRequests", req.id), {
    status: "承認"
  });

  // 履歴に記録
  await addDoc(collection(db, "history"), {
    type: "変更承認",
    actor: auth.currentUser.uid,
    targetItem: req.targetItem,
    changes: req.changes,
    timestamp: serverTimestamp()
  });
}

async function handleReject(req) {
  await updateDoc(doc(db, "editRequests", req.id), {
    status: "却下"
  });
}

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

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (!user) return;

    // 管理者だけが見られるようにする
    const q = query(collection(db, "editRequests"), where("status", "==", "未処理"));
    onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderRequests(requests);
    });
  });
});