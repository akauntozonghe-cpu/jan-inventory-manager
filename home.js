// ✅ Firebase初期化（v8形式）
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
  controlUIByRole();
};

// ✅ 現在時刻表示（秒付き）
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}) `
    + `${now.getHours().toString().padStart(2, "0")}:`
    + `${now.getMinutes().toString().padStart(2, "0")}:`
    + `${now.getSeconds().toString().padStart(2, "0")}`;
  const timeEl = document.getElementById("currentTime");
  if (timeEl) timeEl.textContent = formatted;
}

// ✅ 権限によるUI制御
function controlUIByRole() {
  const role = sessionStorage.getItem("userRole");
  if (!role) return;

  const show = (id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "inline-block";
  };

  if (role === "責任者" || role === "管理者") {
    show("calendarButton");
    show("fleamarketButton");
    show("aiButton");
  }
  if (role === "管理者") {
    show("adminButton");
  }
}

// ✅ メニュー展開
function toggleMenu() {
  const menu = document.getElementById("hamburgerMenu");
  if (!menu) return;
  menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "block" : "none";
}

// ✅ 画面遷移関数群
function goToRegister() { window.location.href = "register.html"; }
function goToList() { window.location.href = "list.html"; }
function goToFleamarket() { window.location.href = "fleamarket.html"; }
function goToCalendar() { window.location.href = "calendar.html"; }
function goToSettings() { window.location.href = "settings.html"; }
function goToAdmin() { window.location.href = "admin.html"; }
function goToImprovementAI() { window.location.href = "ai.html"; }