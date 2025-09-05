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
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function translateRole(role) {
  switch (role) {
    case "admin": return "管理者";
    case "user": return "責任者";
    default: return role;
  }
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  let number = document.getElementById("numberInput").value
    .replace(/\s/g, "")
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

  if (!number) return;

  try {
    const q = query(collection(db, "users"), where("number", "==", number));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      const role = translateRole(data.role);
      const name = data.name;

      sessionStorage.setItem("responsibilityNumber", number);
      sessionStorage.setItem("responsibilityRole", role);
      sessionStorage.setItem("responsibilityName", name);

      await addDoc(collection(db, "logs"), {
        userId: number,
        userName: name,
        role: role,
        action: "ログインしました",
        target: "ログイン画面",
        timestamp: serverTimestamp()
      });

      if (role === "管理者") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "system.html";
      }
    } else {
      alert("該当する責任者が見つかりません");
    }
  } catch (err) {
    console.error(err);
    alert("エラーが発生しました");
  }
});