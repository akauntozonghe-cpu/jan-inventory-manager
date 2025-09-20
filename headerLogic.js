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

// ✅ Firebase初期化
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

// ✅ DOM要素取得
const responsibleUser = document.getElementById("responsibleUser");
const lastJudgment = document.getElementById("lastJudgment");
const clock = document.getElementById("clock");
const adminMenu = document.getElementById("adminMenu");

// ✅ 現在時刻の更新
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
setInterval(updateClock, 1000);
updateClock();

// ✅ メニュー開閉
function toggleMenu() {
  const menu = document.getElementById("headerMenu");
  if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
}

// ✅ ログイン／ログアウト履歴を記録
async function recordLogin(uid) {
  await addDoc(collection(db, "loginLogs"), {
    uid: uid,
    type: "login",
    timestamp: serverTimestamp()
  });
}
async function recordLogout(uid) {
  await addDoc(collection(db, "logoutLogs"), {
    uid: uid,
    type: "logout",
    timestamp: serverTimestamp()
  });
}

// ✅ ログアウト処理
function logout() {
  const uid = localStorage.getItem("uid");
  if (uid) {
    recordLogout(uid); // 痕跡を残す
  }
  signOut(auth).then(() => {
    alert("ログアウトしました");
    localStorage.removeItem("uid");
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("ログアウト失敗:", error);
    alert("ログアウトに失敗しました");
  });
}

// ✅ 責任者番号からUIDを取得
async function getUidById(id) {
  const q = query(collection(db, "users"), where("id", "==", id));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("責任者番号が見つかりません");
  }
  return snapshot.docs[0].id; // ドキュメントID = UID
}

// ✅ UIDから責任者情報を取得
async function getResponsibleInfo(uid) {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error("UIDに紐づく責任者情報が存在しません");
  }
  return userDoc.data();
}

// ✅ 最終ログイン履歴の取得
async function loadLastLogin(uid) {
  const q = query(
    collection(db, "loginLogs"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const log = snapshot.docs[0].data();
    const ts = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);

    const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdayMap[ts.getDay()];
    const month = ts.getMonth() + 1;
    const day = ts.getDate();
    const hour = ts.getHours().toString().padStart(2, "0");
    const minute = ts.getMinutes().toString().padStart(2, "0");
    const second = ts.getSeconds().toString().padStart(2, "0");
    const formatted = `${month}月${day}日（${weekday}）${hour}:${minute}:${second}`;
    if (lastJudgment) lastJudgment.textContent = `🕒 最終ログイン：${formatted}`;
  } else {
    if (lastJudgment) lastJudgment.textContent = "🕒 最終ログイン：記録なし";
  }
}

// ✅ 責任者番号でログイン処理
async function loginById(id) {
  try {
    const uid = await getUidById(id.trim());
    const info = await getResponsibleInfo(uid);

    if (responsibleUser) {
      responsibleUser.textContent = `👑 ${info.name}（${info.role}）`;
    }
    if (info.role === "管理者" && adminMenu) {
      adminMenu.style.display = "block";
    }

    localStorage.setItem("uid", uid);
    localStorage.setItem("role", info.role);

    await recordLogin(uid);   // ✅ ログイン履歴を残す
    await loadLastLogin(uid); // ✅ 最終ログインを表示

    window.location.href = "home.html";
  } catch (err) {
    console.error("loginByIdエラー:", err);
    alert(err.message);
  }
}

// ✅ ホーム画面で自動的に資格を表示
document.addEventListener("DOMContentLoaded", async () => {
  const uid = localStorage.getItem("uid");
  if (uid) {
    try {
      const info = await getResponsibleInfo(uid);
      if (responsibleUser) {
        responsibleUser.textContent = `👑 ${info.name}（${info.role}）`;
      }
      if (info.role === "管理者" && adminMenu) {
        adminMenu.style.display = "block";
      }
      await loadLastLogin(uid);
    } catch (err) {
      console.error("自動ログイン情報取得失敗:", err);
    }
  }

  // ✅ イベントバインド
  const btnMenu = document.getElementById("menuToggle");
  if (btnMenu) btnMenu.addEventListener("click", toggleMenu);

  const btnLogout = document.getElementById("logoutBtn");
  if (btnLogout) btnLogout.addEventListener("click", logout);
});

// ✅ 必要な関数を export
export { loginById, logout, toggleMenu };