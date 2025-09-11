// Firebase初期化
firebase.initializeApp({
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
});
const db = firebase.firestore();

// ロール変換表
const roleMap = {
  admin: "管理者",
  manager: "責任者",
  user: "一般ユーザー"
};

// ページ読み込み時
window.onload = async function () {
  const name = sessionStorage.getItem("userName");
  const role = sessionStorage.getItem("userRole");
  const userId = sessionStorage.getItem("userId");
  const roleJp = roleMap[role] || role;

  document.getElementById("userInfo").textContent = `${name}（${roleJp}）としてログイン中`;

  updateTime();
  setInterval(updateTime, 1000);

  await loadInventorySummary();

  if (role === "admin") {
    document.getElementById("adminList").classList.remove("hidden");
    await loadAdminList();
  }
};

// 現在日時の表示（〇月〇日（〇）形式＋時刻）
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}） ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `現在日時：${formatted}`;
}

// メニュー開閉
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("hidden");
}

// 在庫サマリー表示
async function loadInventorySummary() {
  const snapshot = await db.collection("products").get();
  const total = snapshot.size;
  const expired = snapshot.docs.filter(doc => {
    const limit = doc.data().期限;
    return limit && new Date(limit) < new Date();
  }).length;
  document.getElementById("summary").textContent = `登録商品数：${total}　期限切れ：${expired}`;
}

// 管理者一覧表示
async function loadAdminList() {
  const snapshot = await db.collection("users").where("role", "==", "admin").get();
  const tbody = document.getElementById("adminTableBody");
  snapshot.forEach(doc => {
    const data = doc.data();
    tbody.innerHTML += `<tr><td>${data.name}</td><td>${data.id}</td><td>${data.fcmToken ? "✅" : "❌"}</td></tr>`;
  });
}
