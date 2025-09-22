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

    snapshot.forEach(docSnap => {
      const notif = docSnap.data();
      const notifId = docSnap.id;

      // 対象判定
      if (
        notif.target === "all" ||
        (notif.target === "admin" && role === "管理者") ||
        notif.target === `uid:${uid}`
      ) {
        const li = document.createElement("li");
        li.dataset.notifId = notifId;

        li.classList.add("notificationItem");
        if (notif.type) li.classList.add(notif.type);

        // 既読判定
        if (readMap[notifId]) {
          li.classList.add("read");
        } else {
          li.classList.add("unread");
          unreadCount++;
        }

        li.innerHTML = `
          <div class="notifTitle">${getNotifIcon(notif.type)} ${notif.title}</div>
          <div class="notifBody">${notif.body}</div>
          <div class="notifTime">${notif.createdAt?.toDate().toLocaleString("ja-JP") || ""}</div>
        `;

        notifList.appendChild(li);
      }
    });

    notifCount.textContent = unreadCount;
  });

  // クリックで既読化
  notifList.addEventListener("click", async (e) => {
    const item = e.target.closest(".notificationItem");
    if (item && item.classList.contains("unread")) {
      item.classList.remove("unread");
      item.classList.add("read");

      // バッジ更新
      let count = parseInt(notifCount.textContent, 10);
      if (count > 0) notifCount.textContent = count - 1;

      // Firestore に既読保存
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

  // ヘッダー要素
  const responsibleUser = document.getElementById("responsibleUser");
  const lastJudgment = document.getElementById("lastJudgment");
  const clock = document.getElementById("clock");
  const adminMenu = document.getElementById("adminMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  // ユーザー表示
  if (name && role) {
    responsibleUser.textContent = `👑 ${name} さん（${role}）`;
  } else {
    responsibleUser.textContent = "👑 未ログイン";
  }

  // 最終ログイン表示
  if (lastLogin) {
    const d = new Date(lastLogin);
    lastJudgment.textContent = `🕒 最終：${d.toLocaleString("ja-JP")}`;
  } else {
    lastJudgment.textContent = "🕒 最終：--";
  }

  // 現在時刻をリアルタイム更新
  function updateClock() {
    const now = new Date();
    clock.textContent = `⏱ 現在：${now.toLocaleTimeString("ja-JP")}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 管理者メニュー表示制御
  if (role === "管理者") {
    adminMenu.style.display = "block";
  } else {
    adminMenu.style.display = "none";
  }

  // ログアウト処理
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      alert("ログアウトしました");
      window.location.href = "index.html";
    });
  }

  // ハンバーガーメニュー開閉
  const menuToggle = document.getElementById("menuToggle");
  const headerMenu = document.getElementById("headerMenu");
  if (menuToggle && headerMenu) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("open");
      headerMenu.classList.toggle("open");
    });
  }

  // タイトルクリックでホームへ
  const title = document.querySelector(".headerTitle");
  if (title) {
    title.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }

  // 通知ベル開閉
  const bell = document.getElementById("notificationBlock");
  const dropdown = document.getElementById("notificationDropdown");
  if (bell && dropdown) {
    bell.addEventListener("click", () => {
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