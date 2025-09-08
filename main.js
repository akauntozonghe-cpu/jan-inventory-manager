import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("loginBtn").addEventListener("click", async () => {
  const number = document.getElementById("numberInput").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  const loadingMsg = document.getElementById("loadingMsg");
  errorMsg.textContent = "";
  loadingMsg.textContent = "ログイン中...";

  try {
    const q = query(collection(db, "users"), where("number", "==", number));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const data = snap.docs[0].data();
      const name = data.name;
      const role = data.role === "admin" ? "管理者" : "責任者";

      sessionStorage.setItem("responsibilityNumber", number);
      sessionStorage.setItem("responsibilityName", name);
      sessionStorage.setItem("responsibilityRole", role);

      await addDoc(collection(db, "logs"), {
        userId: number,
        userName: name,
        role: role,
        action: "ログインしました",
        target: "ログイン画面",
        timestamp: serverTimestamp()
      });

      window.location.href = "user.html";
    } else {
      errorMsg.textContent = "番号が見つかりません";
    }
  } catch (err) {
    errorMsg.textContent = "エラーが発生しました";
    console.error(err);
  } finally {
    loadingMsg.textContent = "";
  }
});