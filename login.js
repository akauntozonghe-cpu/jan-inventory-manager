import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
const db = getDatabase(app);

const userCodeInput = document.getElementById("userCode");
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");

userCodeInput.addEventListener("input", async () => {
  const code = userCodeInput.value.trim();
  if (!code) return;

  const userRef = ref(db, `users/${code}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      userInfo.textContent = `${user.name} さん（${user.role}）としてログインします。`;
      userInfo.classList.remove("hidden");
      loginBtn.classList.add("active");
      loginBtn.disabled = false;
    } else {
      userInfo.textContent = "";
      userInfo.classList.add("hidden");
      loginBtn.classList.remove("active");
      loginBtn.disabled = true;
    }
  } catch (error) {
    console.error("照合エラー:", error);
  }
});

loginBtn.addEventListener("click", () => {
  const code = userCodeInput.value.trim();
  if (code) {
    window.location.href = "home.html";
  }
});