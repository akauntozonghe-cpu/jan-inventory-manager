import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ===============================
   トースト通知関数
================================ */
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

/* ===============================
   通知アイコン判定
================================ */
function getNotifIcon(type) {
  switch (type) {
    case "warning": return "⚠️";
    case "info": return "📢";
    case "approval": return "✅";
    default: return "🔔";
  }
}

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

/* ===============================
   通知購読＆既読管理
================================ */
async function initNotifications(uid, role) {
  const notifList = document.getElementById("notificationList");
  const notifCount = document.getElementById("notificationCount");

  // 既読情報を事前に取得
  const readSnapshot = await getDocs(query(collection(db, "userNotifications")));
  const readMap = {};
  readSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.uid === uid && data.read) {
      readMap[data.notifId] = true;
    }
  });

  // 通知ログをリアルタイム購読
  const q = query(collection(db, "notificationLogs"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    notifList.innerHTML = "";
    let unreadCount = 0;
    let count = 0;

    snapshot.forEach(docSnap => {
      if (count >= 10) return; // 最新10件だけ表示
      const notif = docSnap.data();
      const notifId = docSnap.id;

      if (
        notif.target === "all" ||
        (notif.target === "admin" && role === "管理者") ||
        notif.target === `uid:${uid}`
      ) {
        const li = document.createElement("li");
        li.dataset.notifId = notifId;
        li.classList.add("notificationItem");
        if (notif.type) li.classList.add(notif.type);

        if (readMap[notifId]) {
          li.classList.add("read");
        } else {
          li.classList.add("unread");
          unreadCount++;
        }

        li.innerHTML = `
          <div class="notifTitle">${getNotifIcon(notif.type)} ${notif.title}</div>
          <div class="notifBody">${notif.body}</div>
          <div class="notifTime">${notif.createdAt ? formatDateTime(notif.createdAt.toDate()) : ""}</div>
        `;

        notifList.appendChild(li);
        count++;
      }
    });

    // 「もっと見る」リンク
    if (snapshot.size > 10) {
      const moreLi = document.createElement("li");
      moreLi.classList.add("notificationItem", "more-link");
      moreLi.innerHTML = `<a href="notifications.html">📜 もっと見る</a>`;
      notifList.appendChild(moreLi);
    }

    notifCount.textContent = unreadCount;
  });

  // クリックで既読化
  notifList.addEventListener("click", async (e) => {
    const item = e.target.closest(".notificationItem");
    if (item && item.classList.contains("unread")) {
      item.classList.remove("unread");
      item.classList.add("read");

      let count = parseInt(notifCount.textContent, 10);
      if (count > 0) notifCount.textContent = count - 1;

      const notifId = item.dataset.notifId;
      await setDoc(doc(db, "userNotifications", `${uid}_${notifId}`), {
        uid,
        notifId,
        read: true,
        readAt: serverTimestamp()
      });
    }
  });
}

/* ===============================
   ヘッダー初期化
================================ */
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