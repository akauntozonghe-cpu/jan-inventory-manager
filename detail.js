import {
  getFirestore, doc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, addDoc, collection
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const snap = await getDoc(doc(db, "items", id));
  if (!snap.exists()) return;

  const item = snap.data();
  document.getElementById("itemDetail").innerHTML = `
    <h3>${item.name}</h3>
    <p>数量: ${item.quantity} ${item.unit}</p>
    <p>場所: ${item.location}</p>
    <p>大分類: ${item.categoryLarge}</p>
    <p>状態: ${item.status}</p>
  `;

  // 権限に応じてボタンを出す
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.exists() ? userDoc.data().role : "未設定";

    const btnArea = document.getElementById("actionButtons");

    if (role === "管理者") {
      if (item.status === "保留") {
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "承認";
        approveBtn.onclick = async () => {
          await updateDoc(doc(db, "items", id), {
            status: "承認済",
            updatedAt: serverTimestamp()
          });
          await addDoc(collection(db, "history"), {
            type: "承認",
            actor: user.uid,
            targetItem: id,
            timestamp: serverTimestamp()
          });
          alert("承認しました");
        };
        btnArea.appendChild(approveBtn);
      }

      const editBtn = document.createElement("button");
      editBtn.textContent = "編集";
      editBtn.onclick = () => window.location.href = `edit.html?id=${id}`;
      btnArea.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.onclick = async () => {
        if (confirm("本当に削除しますか？")) {
          await deleteDoc(doc(db, "items", id));
          await addDoc(collection(db, "history"), {
            type: "削除",
            actor: user.uid,
            targetItem: id,
            timestamp: serverTimestamp()
          });
          alert("削除しました");
          window.location.href = "list.html";
        }
      };
      btnArea.appendChild(delBtn);

    } else {
      const reqBtn = document.createElement("button");
      reqBtn.textContent = "変更申請";
      reqBtn.onclick = async () => {
        await addDoc(collection(db, "editRequests"), {
          targetItem: id,
          requestedBy: user.uid,
          changes: { example: "ここに変更内容を入れる" },
          status: "未処理",
          timestamp: serverTimestamp()
        });
        alert("変更申請を送信しました");
      };
      btnArea.appendChild(reqBtn);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadDetail);