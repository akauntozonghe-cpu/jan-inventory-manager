/* ===============================
   日時フォーマット関数
   → 〇月〇日（〇）hh:mm:ss
================================ */
function formatDateTime(date) {
  const days = ["日","月","火","水","木","金","土"];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = days[date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${month}月${day}日（${weekday}）${hh}:${mm}:${ss}`;
}

export function initHeader() {
  const uid = localStorage.getItem("uid");
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const lastLogin = localStorage.getItem("lastLogin");

  const responsibleUser = document.getElementById("responsibleUser");
  const lastJudgment = document.getElementById("lastJudgment");
  const clock = document.getElementById("clock");
  const adminMenu = document.getElementById("adminMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  // ✅ グローバルに保持（register.js から参照可能にする）
  window.currentUserInfo = { uid, role, name, lastLogin };

  // ユーザー表示（役割バッジ付き）
  if (name && role) {
    let roleIcon = "👤";
    if (role === "管理者") roleIcon = "🛡";
    else if (role === "責任者") roleIcon = "📋";

    responsibleUser.innerHTML = `👑 ${name} さん <span class="role-badge">${roleIcon} ${role}</span>`;
  } else {
    responsibleUser.textContent = "👑 未ログイン";
  }

  // 最終ログイン表示
  if (lastLogin) {
    const d = new Date(lastLogin);
    lastJudgment.textContent = `🕒 最終：${formatDateTime(d)}`;
  } else {
    lastJudgment.textContent = "🕒 最終：--";
  }

  // 現在時刻をリアルタイム更新
  function updateClock() {
    clock.textContent = `⏱ 現在：${formatDateTime(new Date())}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 管理者メニュー表示制御
  if (role === "管理者") {
    adminMenu.style.display = "block";
  } else {
    adminMenu.style.display = "none";
  }

  // ログアウト処理（トースト通知に変更）
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.currentUserInfo = null; // ✅ グローバル情報もクリア
      showToast("🚪 ログアウトしました", "info");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
    });
  }

  // ハンバーガーメニュー開閉＋外クリックで閉じる
  const menuToggle = document.getElementById("menuToggle");
  const headerMenu = document.getElementById("headerMenu");
  if (menuToggle && headerMenu) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle("open");
      headerMenu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!headerMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove("open");
        headerMenu.classList.remove("open");
      }
    });
  }

  // タイトルクリックでホームへ
  const title = document.querySelector(".headerTitle");
  if (title) {
    title.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }

  // 通知ベル開閉（外クリックで閉じる）
  const bell = document.getElementById("notificationBlock");
  const dropdown = document.getElementById("notificationDropdown");
  if (bell && dropdown) {
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
      if (!bell.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  // 通知購読開始
  if (uid) {
    initNotifications(uid, role);
  }
}