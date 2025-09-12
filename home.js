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
  controlUIByRole();
};

// ✅ 秒付き現在時刻表示
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}) `
    + `${now.getHours().toString().padStart(2, "0")}:`
    + `${now.getMinutes().toString().padStart(2, "0")}:`
    + `${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `${formatted}`;
}

// ✅ ユーザー情報の表示
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

// ✅ 在庫状況の読み込み
async function loadInventorySummary() {
  try {
    const snapshot = await db.collection("products").get();
    const total = snapshot.size;
    let warningCount = 0;
    let expiredCount = 0;
    let approvalPending = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.warning === true) warningCount++;
      if (data.expired === true) expiredCount++;
      if (data.approval === "pending") approvalPending++;
    });

    document.getElementById("inventorySummary").innerHTML = `
      <li>登録商品数：${total} 件</li>
      <li>警告あり：${warningCount} 件</li>
      <li>期限切れ：${expiredCount} 件</li>
      <li>承認待ち：${approvalPending} 件</li>
    `;
  } catch (error) {
    console.error("在庫読み込みエラー:", error);
    document.getElementById("inventorySummary").innerHTML = `<li>読み込み失敗</li>`;
  }
}

// ✅ 権限によるUI制御
function controlUIByRole() {
  const role = sessionStorage.getItem("userRole");

  // 商品一覧は全員表示
  document.getElementById("listButton").style.display = "inline-block";

  // 責任者以上に期限カレンダーを表示
  if (role === "責任者" || role === "管理者") {
    document.getElementById("calendarButton").style.display = "inline-block";
  }

  // 管理者のみ承認画面を表示
  if (role === "管理者") {
    document.getElementById("adminButton").style.display = "inline-block";
  }
}

// ✅ 画面遷移
function goToList() {
  window.location.href = "list.html";
}
function goToAdmin() {
  window.location.href = "admin.html";
}
function goToCalendar() {
  window.location.href = "calendar.html";
}