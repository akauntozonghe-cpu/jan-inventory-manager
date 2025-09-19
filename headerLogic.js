import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ DOM要素取得
const responsibleUser = document.getElementById("responsibleUser");
const lastJudgment = document.getElementById("lastJudgment");
const clock = document.getElementById("clock");
const adminMenu = document.getElementById("adminMenu");

// ✅ 現在時刻の更新（〇〇月〇〇日（〇）〇〇:〇〇:〇〇）
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

// ✅ メニュー制御
function toggleMenu() {
  const menu = document.getElementById("headerMenu");
  if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
}
function closeMenu(event) {
  if (event.target.tagName !== "A") {
    const menu = document.getElementById("headerMenu");
    if (menu) menu.style.display = "none";
  }
}
function goHome() {
  window.location.href = "home.html";
}
function logout() {
  signOut(auth).then(() => {
    alert("ログアウトしました");
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("ログアウト失敗:", error);
    alert("ログアウトに失敗しました");
  });
}

// ✅ 認証状態の監視と責任者表示・管理者メニュー制御
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (responsibleUser) responsibleUser.textContent = "👑 ログイン中：未取得";
    if (lastJudgment) lastJudgment.textContent = "🕒 最終ログイン：未取得";
    return;
  }

  const uid = user.uid;
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    console.warn("ユーザードキュメントが存在しません");
    return;
  }

  const userData = userDoc.data();
  const name = userData?.name || "不明";
  const role = userData?.role || "未設定";

  if (responsibleUser) {
    responsibleUser.textContent = `👑 ${name}（${role}）`;
  }
  if (role === "管理者" && adminMenu) {
    adminMenu.style.display = "block";
  }

  // ✅ 最終ログイン履歴の取得
  try {
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
      const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
      const weekday = weekdayMap[ts.getDay()];
      const month = ts.getMonth() + 1;
      const day = ts.getDate();
      const hour = ts.getHours().toString().padStart(2, "0");
      const minute = ts.getMinutes().toString().padStart(2, "0");
      const second = ts.getSeconds().toString().padStart(2, "0");
      const formatted = `${month}月${day}日（${weekday}）${hour}:${minute}:${second}`;
      if (lastJudgment) lastJudgment.textContent = `🕒 最終ログイン：${formatted}`;
    }
  } catch (err) {
    console.error("ログイン履歴取得失敗:", err);
  }
});

// ✅ グローバル関数登録（HTMLから呼び出す用）
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.goHome = goHome;
window.logout = logout;