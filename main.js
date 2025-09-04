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

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ログイン処理
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputNumber = document.getElementById("managerNumber").value.trim();

    const q = db.collection("users").where("number", "==", inputNumber);
    const snapshot = await q.get();

    if (snapshot.empty) {
      alert("番号が登録されていません");
      return;
    }

    const data = snapshot.docs[0].data();
    sessionStorage.setItem("role", data.role);
    sessionStorage.setItem("number", data.number);

    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
  });
}

// 管理者画面のアクセス制御とデータ表示
if (location.pathname.includes("admin.html")) {
  const role = sessionStorage.getItem("role");
  if (role !== "admin") {
    alert("管理者以外はアクセスできません");
    window.location.href = "index.html";
  } else {
    const docRef = db.collection("adminData").doc("testDoc");
    docRef.get().then((doc) => {
      if (doc.exists) {
        document.getElementById("adminData").innerText = JSON.stringify(doc.data(), null, 2);
      } else {
        document.getElementById("adminData").innerText = "データが存在しません";
      }
    });
  }
}