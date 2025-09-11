firebase.initializeApp({
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
});
const db = firebase.firestore();

const roleMap = { admin: "管理者", manager: "責任者", user: "一般ユーザー" };

window.onload = async function () {
  const name = sessionStorage.getItem("userName");
  const role = sessionStorage.getItem("userRole");
  const roleJp = roleMap[role] || role;

  document.getElementById("userInfo").textContent = `${name}（${roleJp}）としてログイン中`;
  updateTime();
  setInterval(updateTime, 1000);

  setupMenu(role);
  await loadInventorySummary();
  await loadFleamarketStatus();
  await loadUpcomingItems();
  renderCalendar();
};

function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}） ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `現在日時：${formatted}`;
}

function goHome() {
  window.location.href = "home.html";
}

function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("visible");
}

// メニュー外クリックで閉じる
document.addEventListener("click", function (e) {
  const menu = document.getElementById("sideMenu");
  const toggle = document.querySelector(".menu-toggle");
  if (!menu.contains(e.target) && !toggle.contains(e.target)) {
    menu.classList.remove("visible");
  }
});

function setupMenu(role) {
  const menu = [
    { label: "ホーム", link: "home.html", icon: "🏠" },
    { label: "商品登録", link: "register.html", icon: "📦" },
    { label: "商品一覧", link: "list.html", icon: "📋" },
    ...(role === "manager" || role === "admin" ? [{ label: "問題報告", link: "report.html", icon: "⚠️" }] : []),
    { label: "設定", link: "settings.html", icon: "⚙️" },
    { label: "フリマ", link: "fleamarket.html", icon: "🛍️" },
    ...(role === "admin" ? [{ label: "管理者", link: "admin.html", icon: "🧑‍💼" }] : []),
    { label: "ログアウト", link: "login.html", icon: "🔓" }
  ];

  const ul = document.getElementById("menuList");
  ul.innerHTML = "";
  menu.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.link}">${item.icon} ${item.label}</a>`;
    ul.appendChild(li);
  });
}

async function loadInventorySummary() {
  const snapshot = await db.collection("products").get();
  const total = snapshot.size;
  const expired = snapshot.docs.filter(doc => {
    const limit = doc.data().期限;
    return limit && new Date(limit) < new Date();
  }).length;
  document.getElementById("summary").innerHTML = `<h2>📦 在庫状況</h2><p>登録商品数：${total}　期限切れ：${expired}</p>`;
}

async function loadFleamarketStatus() {
  const snapshot = await db.collection("fleamarket").get();
  const total = snapshot.size;
  const pending = snapshot.docs.filter(doc => doc.data().状態 === "未処理").length;
  document.getElementById("fleamarket").innerHTML = `<h2>🛍️ フリマ状況</h2><p>出品数：${total}　未処理：${pending}</p>`;
}

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
    const date = new Date(data.期限);
    const diff = (date - new Date()) / (1000 * 60 * 60 * 24);
    let label = "📅";
    if (diff <= 1) label = "🔥";
    else if (diff <= 3) label = "⚠️";
    return `<li>${label} ${data.name}（期限：${data.期限}）</li>`;
  }).join("");

  document.getElementById("upcoming").innerHTML = `<h2>⏰ 期限の近い商品</h2><ul>${list || "<li>該当なし</li>"}</ul>`;
}

function renderCalendar() {
  const container = document.getElementById("calendarContainer");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  let html = `<table><thead><tr>`;
  ["日","月","火","水","木","金","土"].forEach(d => html += `<th>${d}</th>`);
  html += `</tr></thead><tbody><tr>`;

  for (let i = 0; i < firstDay; i++) html += `<td></td>`;
  for (let d = 1; d <= lastDate; d++) {
    const isToday = d === today ? ' class="today"' : '';
    html += `<td${isToday}>${d}</td>`;
    if ((firstDay + d) % 7 === 0) html += `</tr><tr>`;
  }

  html += `</tr></tbody></table>`;
  container.innerHTML = html;
}
