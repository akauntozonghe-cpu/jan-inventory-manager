// ✅ Firebase初期化
firebase.initializeApp({
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
});
const db = firebase.firestore();

// ✅ 起動時処理
window.onload = () => {
  updateTime();
  setInterval(updateTime, 1000);
  loadUserInfo();
  controlUIByRole();
};

// ✅ 秒付き現在時刻
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}) `
    + `${now.getHours().toString().padStart(2, "0")}:`
    + `${now.getMinutes().toString().padStart(2, "0")}:`
    + `${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = formatted;
}

// ✅ 責任者氏名＋権限表示
function loadUserInfo() {
  const userName = sessionStorage.getItem("userName");
  const userRole = sessionStorage.getItem("userRole");
  document.getElementById("userName").textContent = userName || "未設定";
  document.getElementById("userRole").textContent = userRole || "未設定";
}

// ✅ ログアウト処理
function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

// ✅ ホームに戻る
function goToHome() {
  window.location.href = "home.html";
}

// ✅ メニュー展開
function toggleMenu() {
  const menu = document.getElementById("hamburgerMenu");
  if (!menu) return;
  menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "block" : "none";
}

// ✅ 権限によるUI制御
function controlUIByRole() {
  const role = sessionStorage.getItem("userRole");
  if (!role) return;

  const show = (id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "inline-block";
  };

  if (["責任者", "管理者"].includes(role)) {
    show("calendarSection");
    show("fleamarketButton");
  }
  if (role === "管理者") {
    show("adminButton");
  }
}

// ✅ 画面遷移関数群
function goToRegister() { window.location.href = "register.html"; }
function goToList() { window.location.href = "list.html"; }
function goToFleamarket() { window.location.href = "fleamarket.html"; }
function goToReport() { window.location.href = "report.html"; }
function goToAdmin() { window.location.href = "admin.html"; }
function goToSettings() { window.location.href = "settings.html"; }