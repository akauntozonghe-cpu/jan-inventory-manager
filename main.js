import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.firebasestorage.app",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase 初期化完了");

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