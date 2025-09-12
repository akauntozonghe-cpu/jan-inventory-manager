// Firebase初期化
firebase.initializeApp({
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
});
const db = firebase.firestore();

// 起動時処理
window.onload = function () {
  updateTime();
  setInterval(updateTime, 1000);
  loadUserInfo();
  loadInventorySummary();
};

// 秒付き現在時刻表示
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}) `
    + `${now.getHours().toString().padStart(2, "0")}:`
    + `${now.getMinutes().toString().padStart(2, "0")}:`
    + `${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `現在日時：${formatted}`;
}

// ユーザー情報の表示
async function loadUserInfo() {
  const userId = sessionStorage.getItem("userId");
  const userName = sessionStorage.getItem("userName");
  const userRole = sessionStorage.getItem("userRole");

  document.getElementById("userName").textContent = userName || "未設定";
  document.getElementById("userRole").textContent = userRole || "未設定";
  document.getElementById("userInfo").textContent = `${userName}（${userRole}）`;

  try {
    const snapshot = await db.collection("users").where("id", "==", userId).get();
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      const lastLogin = userData.lastLogin?.toDate();
      if (lastLogin) {
        const formatted = `${lastLogin.getMonth() + 1}月${lastLogin.getDate()}日 `
          + `${lastLogin.getHours().toString().padStart(2, "0")}:`
          + `${lastLogin.getMinutes().toString().padStart(2, "0")}:`
          + `${lastLogin.getSeconds().toString().padStart(2, "0")}`;
        document.getElementById("lastLogin").textContent = formatted;
      }
    }
  } catch (error) {
    console.error("ユーザー情報取得エラー:", error);
  }
}

// 在庫状況の読み込み（例：商品数と警告数）
async function loadInventorySummary() {
  try {
    const snapshot = await db.collection("products").get();
    const total = snapshot.size;
    let warningCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.warning === true) warningCount++;
    });

    document.getElementById("inventorySummary").innerHTML =
      `<p>登録商品数：${total} 件</p><p>警告あり：${warningCount} 件</p>`;
  } catch (error) {
    console.error("在庫読み込みエラー:", error);
    document.getElementById("inventorySummary").textContent = "読み込み失敗";
  }
}

// 画面遷移
function goToList() {
  window.location.href = "list.html";
}
function goToAdmin() {
  window.location.href = "admin.html";
}