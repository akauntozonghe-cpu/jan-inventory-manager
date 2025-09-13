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
  setupMenuCloseOnOutsideClick();
  loadAISuggestions();
  loadCalendar();
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

// ✅ 氏名＋権限（横並び）
function loadUserInfo() {
  const userName = sessionStorage.getItem("userName") || "村本悠気";
  const userRole = sessionStorage.getItem("userRole") || "管理者";
  document.getElementById("userName").textContent = userName;
  document.getElementById("userRole").textContent = `（${userRole}）`;
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
  menu.style.display = "block";
}

// ✅ メニュー外クリックで閉じる
function setupMenuCloseOnOutsideClick() {
  document.addEventListener("click", (event) => {
    const menu = document.getElementById("hamburgerMenu");
    const toggle = document.getElementById("menuToggle");
    if (!menu || !toggle) return;
    const isClickInside = menu.contains(event.target) || toggle.contains(event.target);
    if (!isClickInside) {
      menu.style.display = "none";
    }
  });
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

// ✅ AI提案表示（管理者のみ承認可能）
function loadAISuggestions() {
  const role = sessionStorage.getItem("userRole");
  db.collection("aiSuggestions").get().then(snapshot => {
    const container = document.getElementById("suggestionList");
    container.innerHTML = "";
    snapshot.forEach(doc => {
      const s = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${s.product}</strong><br>
        ${s.message}<br>
        提案：${s.recommendedAction}<br>
      `;
      if (role === "管理者" && s.status === "未処理") {
        li.innerHTML += `
          <button onclick="approveSuggestion('${doc.id}')">承認</button>
          <button onclick="rejectSuggestion('${doc.id}')">却下</button>
        `;
      }
      if (role === "管理者" && s.status !== "未処理") {
        li.innerHTML += `
          状態：${s.status}（${s.approvedBy}）<br>
          時刻：${new Date(s.approvedAt).toLocaleString()}
        `;
      }
      container.appendChild(li);
    });
  });
}

// ✅ 承認・却下処理（管理者のみ）
function approveSuggestion(id) {
  const role = sessionStorage.getItem("userRole");
  if (role !== "管理者") return alert("管理者のみ承認可能です");
  const userName = sessionStorage.getItem("userName");
  const now = new Date().toISOString();
  db.collection("aiSuggestions").doc(id).update({
    status: "承認",
    approvedBy: userName,
    approvedAt: now
  }).then(() => {
    loadAISuggestions();
    loadCalendar();
  });
}

function rejectSuggestion(id) {
  const role = sessionStorage.getItem("userRole");
  if (role !== "管理者") return alert("管理者のみ却下可能です");
  const userName = sessionStorage.getItem("userName");
  const now = new Date().toISOString();
  db.collection("aiSuggestions").doc(id).update({
    status: "却下",
    approvedBy: userName,
    approvedAt: now
  }).then(() => {
    loadAISuggestions();
    loadCalendar();
  });
}

// ✅ カレンダー表示（月間ビュー＋AI提案反映）
function loadCalendar() {
  const calendarGrid = document.getElementById("calendarView");
  calendarGrid.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day";
    calendarGrid.appendChild(empty);
  }

  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cell.innerHTML = `<strong>${d}</strong><div id="day-${dateStr}"></div>`;
    calendarGrid.appendChild(cell);
  }

  db.collection("aiSuggestions")
    .where("status", "==", "承認")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const s = doc.data();
        const tagContainer = document.getElementById(`day-${s.scheduledDate}`);
        if (tagContainer) {
          const tag = document.createElement("span");
          tag.className = `calendar-tag ${getTagClass(s.type)}`;
          tag.textContent = `${getTagIcon(s.type)} ${s.product}：${s.calendarTag}`;
          tagContainer.appendChild(tag);
        }
      });
    });
}

function getTagClass(type) {
  if (type === "期限予測") return "expiry";
  if (type === "在庫予測") return "reorder";
  if (type === "売れ残り分析") return "improvement";
  return "default";
}

function getTagIcon(type) {
  if (type === "期限予測") return "⚠️";
  if (type === "在庫予測") return "📦";
  if (type === "売れ残り分析") return "💡";
  return "📅";
}