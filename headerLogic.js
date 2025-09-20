import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ===============================
   Firebase 初期化
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ===============================
   Firestore ログ記録
================================ */
async function recordLogin(uid) {
  await addDoc(collection(db, "loginLogs"), {
    uid,
    type: "login",
    timestamp: serverTimestamp()
  });
}
async function recordLogout(uid) {
  await addDoc(collection(db, "logoutLogs"), {
    uid,
    type: "logout",
    timestamp: serverTimestamp()
  });
}

/* ===============================
   ユーザー情報取得
================================ */
async function getUidById(id) {
  const q = query(collection(db, "users"), where("id", "==", id));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("責任者番号が見つかりません");
  return snapshot.docs[0].id; // ドキュメントID = UID
}

async function getResponsibleInfo(uid) {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) throw new Error("UIDに紐づく責任者情報が存在しません");
  return userDoc.data();
}

/* ===============================
   最終ログ取得（ログイン／ログアウト両方を照合）
================================ */
async function loadLast(uid) {
  const loginQ = query(
    collection(db, "loginLogs"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const logoutQ = query(
    collection(db, "logoutLogs"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const [loginSnap, logoutSnap] = await Promise.all([
    getDocs(loginQ),
    getDocs(logoutQ)
  ]);

  const loginTs = !loginSnap.empty ? loginSnap.docs[0].data().timestamp?.toDate() : null;
  const logoutTs = !logoutSnap.empty ? logoutSnap.docs[0].data().timestamp?.toDate() : null;

  let latest = null;
  if (loginTs && logoutTs) {
    latest = loginTs > logoutTs ? loginTs : logoutTs;
  } else {
    latest = loginTs || logoutTs;
  }

  const el = document.getElementById("lastJudgment");
  if (!el) return;

  if (latest) {
    const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdayMap[latest.getDay()];
    const month = latest.getMonth() + 1;
    const day = latest.getDate();
    el.textContent = `🕒 最終：${month}月${day}日（${weekday}）`;
  } else {
    el.textContent = "🕒 最終：記録なし";
  }
}

/* ===============================
   ログイン / ログアウト
================================ */
async function loginById(id) {
  try {
    const uid = await getUidById(id.trim());
    const info = await getResponsibleInfo(uid);

    localStorage.setItem("uid", uid);
    localStorage.setItem("role", info.role || "");

    // 痕跡を残す
    await recordLogin(uid);

    // ✅ 直後に表示更新
    await loadLast(uid);

    // ページ遷移
    window.location.href = "home.html";
  } catch (err) {
    console.error("loginByIdエラー:", err);
    alert(err.message);
  }
}

function logout() {
  const uid = localStorage.getItem("uid");
  if (uid) {
    recordLogout(uid)
      .then(() => loadLast(uid)) // ✅ ログアウト直後に更新
      .catch(console.error);
  }

  signOut(auth)
    .catch(err => {
      console.warn("Authサインアウト警告:", err);
    })
    .finally(() => {
      localStorage.removeItem("uid");
      localStorage.removeItem("role");
      alert("ログアウトしました");
      window.location.href = "index.html";
    });
}

/* ===============================
   ヘッダー初期化（ヘッダー挿入後に必ず呼ぶ）
================================ */
function initHeader() {
  const responsibleUser = document.getElementById("responsibleUser");
  const lastJudgment = document.getElementById("lastJudgment");
  const clock = document.getElementById("clock");
  const adminMenu = document.getElementById("adminMenu");
  const headerMenu = document.getElementById("headerMenu");
  const btnMenu = document.getElementById("menuToggle");
  const title = document.querySelector(".headerTitle");

  // 時計（現在は時刻まで表示）
  function updateClock() {
    const now = new Date();
    const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdayMap[now.getDay()];
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const second = now.getSeconds().toString().padStart(2, "0");
    const formatted = `${month}月${day}日（${weekday}）${hour}:${minute}:${second}`;
    if (clock) clock.textContent = `⏱ 現在：${formatted}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ハンバーガー開閉
  if (btnMenu) {
    btnMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      headerMenu.classList.toggle("open");
      btnMenu.classList.toggle("open");
    });
  }

  // メニュー外クリックで閉じる
  document.addEventListener("click", (e) => {
    if (headerMenu && headerMenu.classList.contains("open")) {
      if (!headerMenu.contains(e.target) && !btnMenu.contains(e.target)) {
        headerMenu.classList.remove("open");
        btnMenu.classList.remove("open");
      }
    }
  });

  // タイトルクリックでホームへ
  if (title) {
    title.style.cursor = "pointer";
    title.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }

  // ログアウト
  const btnLogout = document.getElementById("logoutBtn");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  // 現在ページハイライト
  const currentPath = window.location.pathname.split("/").pop();
  const menuLinks = document.querySelectorAll("#headerMenu ul.menu li a");
  menuLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href && href === currentPath) link.classList.add("active");
  });

  // ログイン済みなら資格と最終表示、管理者メニュー制御
  const uid = localStorage.getItem("uid");
  const role = localStorage.getItem("role");

  if (uid) {
    getResponsibleInfo(uid)
      .then(info => {
        if (responsibleUser) {
          const name = info.name || "不明";
          const roleText = info.role || role || "一般";
          responsibleUser.textContent = `👑 ${name}（${roleText}）`;
        }
        if ((info.role === "管理者" || role === "管理者") && adminMenu) {
          adminMenu.style.display = "block";
        }
      })
      .then(() => loadLast(uid))
      .catch(err => console.error("資格/最終表示失敗:", err));
    } else {
    // 未ログイン時の初期表示
    if (responsibleUser) responsibleUser.textContent = "👑 未ログイン";
    if (lastJudgment) lastJudgment.textContent = "🕒 最終：--";
    if (adminMenu) adminMenu.style.display = "none";
  }
}

/* ===============================
   エクスポート
================================ */
export { initHeader, loginById, logout };