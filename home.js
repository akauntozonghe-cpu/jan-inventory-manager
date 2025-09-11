// Firebase初期化
firebase.initializeApp({
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
});
const db = firebase.firestore();

// ロール変換表
const roleMap = { admin: "管理者", manager: "責任者", user: "一般ユーザー" };

window.onload = async function () {
  const name = sessionStorage.getItem("userName");
  const role = sessionStorage.getItem("userRole");
  const userId = sessionStorage.getItem("userId");
  const roleJp = roleMap[role] || role;

  document.getElementById("userInfo").textContent = `${name}（${roleJp}）としてログイン中`;
  updateTime();
  setInterval(updateTime, 1000);

  setupMenu(role);
  await loadInventorySummary();
  await loadFleamarketStatus();
  await loadUpcomingItems();
};

// 現在日時（秒単位・曜日付き）
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}） ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `現在日時：${formatted}`;
}

// タイトルクリックでホームに戻る（スマホ含む）
function goHome() {
  window.location.href = "home.html";
}

// ハンバーガーメニュー開閉
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("hidden");
}

// メニュー構成（ロール別）
function setupMenu(role) {
  const menu = [
    { label: "商品登録", link: "register.html" },
    { label: "商品一覧", link: "list.html" },
    ...(role === "manager" || role === "admin" ? [{ label: "問題報告", link: "report.html" }] : []),
    { label: "設定", link: "settings.html" },
    { label: "フリマ", link: "fleamarket.html" },
    ...(role === "admin" ? [{ label: "管理者", link: "admin.html" }] : []),
    { label: "ログアウト", link: "login.html" }
  ];
  const ul = document.getElementById("menuList");
  menu.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.link}">${item.label}</a>`;
    ul.appendChild(li);
  });
}

// 在庫状況の表示
async function loadInventorySummary() {
  const snapshot = await db.collection("products").get();
  const total = snapshot.size;
  const expired = snapshot.docs.filter(doc => {
    const limit = doc.data().期限;
    return limit && new Date(limit) < new Date();
  }).length;
  document.getElementById("summary").innerHTML = `<h2>在庫状況</h2><p>登録商品数：${total}　期限切れ：${expired}</p>`;
}

// フリマ状況の表示
async function loadFleamarketStatus() {
  const snapshot = await db.collection("fleamarket").get();
  const total = snapshot.size;
  const pending = snapshot.docs.filter(doc => doc.data().状態 === "未処理").length;
  document.getElementById("fleamarket").innerHTML = `<h2>フリマ状況</h2><p>出品数：${total}　未処理：${pending}</p>`;
}

// 期限の近い商品表示（7日以内）
async function loadUpcomingItems() {
  const snapshot = await db.collection("products").get();
  const upcoming = snapshot.docs.filter(doc => {
    const limit = doc.data().期限;
    if (!limit) return false;
    const date = new Date(limit);
    const now = new Date();
    const diff = (date - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });
  const list = upcoming.map(doc => {
    const data = doc.data();
    return `<li>${data.name}（期限：${data.期限}）</li>`;
  }).join("");
  document.getElementById("upcoming").innerHTML = `<h2>期限の近い商品</h2><ul>${list || "<li>該当なし</li>"}</ul>`;
}
