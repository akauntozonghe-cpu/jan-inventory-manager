import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

const $ = s => document.querySelector(s);
const toast = (msg, type='info') => {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 2000);
  setTimeout(() => t.remove(), 2600);
};

async function logAction(action, detail = {}) {
  const id = sessionStorage.getItem("responsibilityId");
  const name = sessionStorage.getItem("responsibilityName");
  const role = sessionStorage.getItem("responsibilityRole");
  await addDoc(collection(db, "logs"), {
    userId: id,
    userName: name,
    role,
    action,
    detail,
    timestamp: serverTimestamp()
  });
}

$('#loginBtn').onclick = async () => {
  const input = $('#responsibilityId');
  const id = input.value.trim();
  if (!id) {
    input.classList.add("is-invalid");
    setTimeout(() => input.classList.remove("is-invalid"), 1000);
    return toast('責任者番号を入力してください', 'error');
  }

  try {
    const q = query(collection(db, "users"), where("id", "==", id));
    const snap = await getDocs(q);
    if (snap.empty) return toast('番号が見つかりません', 'error');

    const data = snap.docs[0].data();
    sessionStorage.setItem("responsibilityId", id);
    sessionStorage.setItem("responsibilityName", data.name);
    sessionStorage.setItem("responsibilityRole", data.role);

    await logAction("ログイン");

    toast('ログイン成功', 'success');
    setTimeout(() => location.href = "responsibility.html", 800);
  } catch (e) {
    console.error(e);
    toast('ログイン処理に失敗しました', 'error');
  }
};

