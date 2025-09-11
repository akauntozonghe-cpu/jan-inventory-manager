// Firebase初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, query
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 共通関数
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function updateTime(el) {
  const now = new Date();
  el.textContent = now.toLocaleString("ja-JP");
}

async function generateManagementNumber(key) {
  const q = query(collection(db, "products"));
  const snapshot = await getDocs(q);
  let count = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.managementKey === key) count++;
  });
  return `${key}-${count + 1}`;
}

// DOM要素取得
const loginSection = document.getElementById("loginSection");
const homeSection = document.getElementById("homeSection");
const loginBtn = document.getElementById("loginBtn");
const userIdInput = document.getElementById("userIdInput");
const loginError = document.getElementById("loginError");
const userNameDisplay = document.getElementById("userNameDisplay");
const userRoleBadge = document.getElementById("userRoleBadge");
const currentTime = document.getElementById("currentTime");

const navRegister = document.getElementById("navRegister");
const navList = document.getElementById("navList");
const navReport = document.getElementById("navReport");
const navAdmin = document.getElementById("navAdmin");

const registerSection = document.getElementById("registerSection");
const listSection = document.getElementById("listSection");
const reportSection = document.getElementById("reportSection");
const adminSection = document.getElementById("adminSection");

const registerBtn = document.getElementById("registerBtn");
const productList = document.getElementById("productList");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

let currentUser = null;

// ログイン処理
import { query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

async function login(userId) {
  const q = query(collection(db, "users"), where("id", "==", userId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    loginError.textContent = "番号が正しくありません";
    return;
  }

  const userDoc = snapshot.docs[0];
  currentUser = userDoc.data();

  loginSection.classList.add("hidden");
  homeSection.classList.remove("hidden");
  userNameDisplay.textContent = currentUser.name;
  userRoleBadge.textContent = currentUser.role === "admin" ? "管理者" : "責任者";
  userRoleBadge.classList.add(currentUser.role);
  if (currentUser.role === "admin") navAdmin.classList.remove("hidden");
  updateTime(currentTime);
  showToast("ログインしました");
}

loginBtn.addEventListener("click", () => login(userIdInput.value.trim()));
userIdInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login(userIdInput.value.trim());
});

// 画面切替
function showSection(section) {
  [registerSection, listSection, reportSection, adminSection].forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
}

navRegister.addEventListener("click", () => showSection(registerSection));
navList.addEventListener("click", () => showSection(listSection));
navReport.addEventListener("click", () => showSection(reportSection));
navAdmin.addEventListener("click", () => showSection(adminSection));

// 商品登録処理
registerBtn.addEventListener("click", async () => {
  const name = document.getElementById("productName").value.trim();
  const jan = document.getElementById("janCode").value.trim();
  const lot = document.getElementById("lotNo").value.trim();
  const qty = parseInt(document.getElementById("quantity").value.trim());
  const unit = document.getElementById("unitSelect").value;
  const location = document.getElementById("locationSelect").value;
  const category = document.getElementById("categorySelect").value;
  const subcategory = document.getElementById("subcategoryInput").value.trim();

  if (!name || !jan || !lot || isNaN(qty)) {
    showToast("必須項目が未入力です");
    return;
  }

  const managementKey = `${jan}-${lot}`;
  const managementNumber = await generateManagementNumber(managementKey);

  const productData = {
    productName: name,
    janCode: jan,
    lotNo: lot,
    quantity: qty,
    unit,
    location,
    category,
    subcategory,
    managementKey,
    managementNumber,
    createdBy: currentUser.name,
    createdAt: new Date().toISOString(),
    status: "pending"
  };

  await addDoc(collection(db, "products"), productData);
  showToast("商品登録申請を送信しました");
});

// 商品検索処理
searchBtn.addEventListener("click", async () => {
  const keyword = searchInput.value.trim();
  productList.innerHTML = "";
  const q = query(collection(db, "products"));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    if (
      data.productName.includes(keyword) ||
      data.janCode.includes(keyword)
    ) {
      const li = document.createElement("li");
      li.textContent = `${data.productName}（${data.managementNumber}） - ${data.location}`;
      productList.appendChild(li);
    }
  });
  showToast("検索完了");
});

// メニュー開閉
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!sideMenu.contains(e.target) && e.target !== menuToggle) {
    sideMenu.classList.add("hidden");
  }
});

// 時刻更新
setInterval(() => updateTime(currentTime), 60000);

