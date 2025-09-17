import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

// Firebase初期化
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM要素
const responsibleUser = document.getElementById("responsibleUser");
const lastJudgment = document.getElementById("lastJudgment");
const clock = document.getElementById("clock");
const adminMenuItem = document.getElementById("adminMenuItem");

// メニュー開閉
export function toggleMenu() {
  const menu = document.getElementById("headerMenu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
}

export function closeMenu(event) {
  if (event.target.tagName !== "A") {
    const menu = document.getElementById("headerMenu");
    if (menu) menu.style.display = "none";
  }
}

// ホームに戻る
export function goHome() {
  window.location.href = "home.html";
}

// ログアウト
export function logout() {
  signOut(auth).then(() => {
    alert("ログアウトしました");
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("ログアウト失敗:", error);
    alert("ログアウトに失敗しました");
  });
}

// 現在時刻の更新
function updateClock() {
  const now = new Date();
  const options = { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const formatted = now.toLocaleString("ja-JP", options);
  clock.textContent = `⏱ 現在：${formatted}`;
}
setInterval(updateClock, 1000);
updateClock();

// 認証状態の監視と責任者情報の表示
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    responsibleUser.textContent = "👑 ログイン中：未取得";
    lastJudgment.textContent = "🕒 最終ログイン：未取得";
    return;
  }

  const uid = localStorage.getItem("uid");
  if (!uid) return;

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.data();
    const name = userData?.name || "不明";
    const role = userData?.role || "未設定";

    responsibleUser.textContent = `👑 ${name}（${role}）`;

    // 管理者のみメニュー表示
    if (role === "管理者" && adminMenuItem) {
      adminMenuItem.style.display = "block";
    }

    // 最終ログイン取得
    const q = query(
      collection(db, "loginLogs"),
      where("uid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const log = snapshot.docs[0].data();
      const ts = new Date(log.timestamp);
      const formatted = ts.toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
      lastJudgment.textContent = `🕒 最終ログイン：${formatted}`;
    }
  } catch (err) {
    console.error("責任者情報取得失敗:", err);
  }
});