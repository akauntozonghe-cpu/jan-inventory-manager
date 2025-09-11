// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM取得
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginBtn = document.getElementById("loginBtn");
const loginId = document.getElementById("loginId");
const loginError = document.getElementById("loginError");
const userBadge = document.getElementById("userBadge");
const titleHeader = document.getElementById("titleHeader");

// 権限ラベル（日本語）
function getRoleLabel(role) {
  return role === "admin" ? "管理者" : "責任者";
}

// ログイン状態判定
function isLoggedIn() {
  return sessionStorage.getItem("userId") !== null;
}

// 初期表示制御
window.addEventListener("DOMContentLoaded", async () => {
  if (isLoggedIn()) {
    loginSection.classList.add("hidden");
    mainSection.classList.remove("hidden");

    const role = sessionStorage.getItem("role");
    const name = sessionStorage.getItem("userName");
    userBadge.textContent = `${name}（${getRoleLabel(role)}）`;

    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = role === "admin" ? "block" : "none";
    });

    if (role === "admin") {
      userBadge.classList.add("admin-badge");
      await updateAdminBadge();
    }

    routeTo("homeSection");
    await renderHomeDashboard();
  } else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
});

// ログイン処理
loginBtn.addEventListener("click", async () => {
  clearInlineError(loginError);
  const id = loginId.value.trim();
  if (!id) {
    showInlineError(loginError, "責任者番号を入力してください");
    loginId.focus();
    return;
  }

  const snapshot = await db.collection("users").where("id", "==", id).get();
  if (snapshot.empty) {
    showInlineError(loginError, "責任者番号が見つかりません");
    loginId.focus();
    return;
  }

  const user = snapshot.docs[0].data();
  sessionStorage.setItem("userId", user.id);
  sessionStorage.setItem("userName", user.name);
  sessionStorage.setItem("role", user.role);

  document.body.classList.toggle("admin", user.role === "admin");
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = user.role === "admin" ? "block" : "none";
  });

  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  mainSection.classList.add("fade-in");

  userBadge.textContent = `${user.name}（${getRoleLabel(user.role)}）`;
  if (user.role === "admin") {
    userBadge.classList.add("admin-badge");
    await updateAdminBadge();
  }

  showToast("ログインしました", "success");
  routeTo("homeSection");
  await renderHomeDashboard();

  await db.collection("logs").add({
    type: "login",
    userId: user.id,
    userName: user.name,
    role: user.role,
    timestamp: new Date().toISOString()
  });
});

// エラー表示関数
function showInlineError(el, message) {
  el.textContent = message;
  el.classList.add("show");
}
function clearInlineError(el) {
  el.textContent = "";
  el.classList.remove("show");
}

// トースト通知関数
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast-${type}`;
  if (document.body.dataset.toast !== "off") {
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }
}

// Enterキー送信対応
loginId.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    loginBtn.click();
  }
});

// 管理者バッジ更新
async function updateAdminBadge() {
  const snap = await db.collection("products").where("status", "==", "pending").get();
  const count = snap.size;
  const badge = document.querySelector('[data-route="adminSection"]');
  badge.textContent = count > 0 ? `🛡️ 管理者画面（${count}件）` : "🛡️ 管理者画面";

  if (count > 0) {
    showToast(`承認待ちの商品が ${count} 件あります`, "warning");
  }
}

// 画面切替処理
function routeTo(sectionId) {
  document.querySelectorAll("section.content").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");
}

// ホーム画面表示
async function renderHomeDashboard() {
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map(doc => doc.data());

  const now = new Date();
  const total = products.length;
  const approved = products.filter(p => p.status === "approved").length;
  const expired = products.filter(p => new Date(p.expire) < now).length;
  const soon = products.filter(p => {
    const d = new Date(p.expire);
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  const flea = products.filter(p => p.market === "flea");

  titleHeader.textContent = `在庫管理（${now.toLocaleDateString()} ${now.toLocaleTimeString()}）`;

  document.getElementById("summaryStats").innerHTML = `
    <p>登録：${total}件 / 承認済：${approved}件 / 期限切れ：${expired}件</p>
  `;
  document.getElementById("expiringSoon").innerHTML = `
    <h4>⏰ 期限間近の商品</h4>
    <ul>${soon.map(p => `<li>${p.productName}（${p.expire}）</li>`).join("")}</ul>
  `;
  document.getElementById("fleaMarketInfo").innerHTML = `
    <h4>🛍️ フリマ出品情報</h4>
    <ul>${flea.map(p => `<li>${p.productName}（${p.marketDate || "未設定"}）</li>`).join("")}</ul>
  `;
}

// ログアウト処理
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const uid = sessionStorage.getItem("userId");
  await db.collection("logs").add({
    type: "logout",
    userId: uid,
    timestamp: new Date().toISOString()
  });
  sessionStorage.clear();
  location.reload();
});

