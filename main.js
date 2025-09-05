import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase 初期化完了");

// ログイン処理
document.getElementById("loginBtn").addEventListener("click", async () => {
  const number = document.getElementById("numberInput").value.trim();
  if (!number) {
    alert("番号を入力してください");
    return;
  }

  try {
    const docRef = doc(db, "responsibleNumbers", number);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const role = docSnap.data().role;
      sessionStorage.setItem("responsibilityNumber", number); // ← ログ記録用に保存

      if (role === "admin") {
        alert("管理者としてログイン成功");
        window.location.href = "admin.html";
      } else {
        alert("ユーザーとしてログイン成功");
        window.location.href = "system.html";
      }
    } else {
      alert("番号が見つかりません");
    }
  } catch (err) {
    console.error(err);
    alert("エラーが発生しました");
  }
});

// 在庫更新＋履歴記録処理
document.getElementById("updateBtn").addEventListener("click", async () => {
  const itemId = document.getElementById("itemIdInput").value.trim();
  const quantity = parseInt(document.getElementById("quantityInput").value, 10);
  const userId = sessionStorage.getItem("responsibilityNumber");

  if (!itemId || isNaN(quantity)) {
    alert("JANコードと数量を入力してください");
    return;
  }

  try {
    // 在庫更新
    await updateDoc(doc(db, "items", itemId), {
      quantity: quantity,
      updatedAt: serverTimestamp()
    });

    // 操作履歴を記録
    await addDoc(collection(db, "logs"), {
      action: "update",
      itemId: itemId,
      userId: userId,
      timestamp: serverTimestamp()
    });

    alert("在庫更新と履歴記録が完了しました");
  } catch (err) {
    console.error("更新エラー:", err);
    alert("在庫の更新に失敗しました");
  }
});