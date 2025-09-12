// Firebase初期化
firebase.initializeApp({
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
});
const db = firebase.firestore();

// 起動時処理
window.onload = () => {
  updateTime();
  setInterval(updateTime, 1000);
  loadUserInfo();
  loadInventorySummary();
  loadFleamarketSummary();
  loadDeadlineSummary();
  loadCalendarView();
  loadAISuggestions();
  controlUIByRole();
};

// ✅ 秒付き現在時刻（ラベルなし）
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}) `
    + `${now.getHours().toString().padStart(2, "0")}:`
    + `${now.getMinutes().toString().padStart(2, "0")}:`
    + `${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = formatted;
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

// ✅ 在庫情報の読み込み
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
  }
}

// ✅ フリマ情報の読み込み
async function loadFleamarketSummary() {
  const role = sessionStorage.getItem("userRole");
  if (role !== "責任者" && role !== "管理者") {
    document.getElementById("fleamarketSection").style.display = "none";
    return;
  }

  try {
    const snapshot = await db.collection("products").where("listed", "==", true).get();
    const listedCount = snapshot.size;
    let soonExpired = 0;
    let soldCount = 0;
    let priceTotal = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const deadline = data.listingDeadline?.toDate();
      if (deadline && (deadline - new Date()) < 3 * 24 * 60 * 60 * 1000) soonExpired++;
      if (data.sold === true) soldCount++;
      if (data.price) priceTotal += data.price;
    });

    const avgPrice = listedCount ? Math.round(priceTotal / listedCount) : 0;

    document.getElementById("fleamarketSummary").innerHTML = `
      <li>出品中：${listedCount} 件</li>
      <li>期限間近：${soonExpired} 件</li>
      <li>今月売れた商品：${soldCount} 件</li>
      <li>平均価格：¥${avgPrice}</li>
    `;
  } catch (error) {
    console.error("フリマ情報取得エラー:", error);
  }
}

// ✅ 期限の近いもの
async function loadDeadlineSummary() {
  const role = sessionStorage.getItem("userRole");
  if (role !== "責任者" && role !== "管理者") {
    document.getElementById("deadlineSection").style.display = "none";
    return;
  }

  try {
    const snapshot = await db.collection("products").get();
    const now = new Date();
    const soon = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const deadline = data.deadline?.toDate();
      if (deadline && (deadline - now) < 3 * 24 * 60 * 60 * 1000) {
        soon.push(data.name);
      }
    });

    const list = soon.map(name => `<li>${name} の期限が近い</li>`).join("");
    document.getElementById("deadlineSummary").innerHTML = list || "<li>期限間近の商品はありません</li>";
  } catch (error) {
    console.error("期限情報取得エラー:", error);
  }
}

// ✅ カレンダーAI（仮表示）
function loadCalendarView() {
  const role = sessionStorage.getItem("userRole");
  if (role !== "責任者" && role !== "管理者") {
    document.getElementById("calendarSection").style.display = "none";
    return;
  }

  document.getElementById("calendarView").textContent = "今週の優先対応：商品Bの承認、商品Cの出品期限が迫っています。";
}

// ✅ 改善AI（仮表示）
function loadAISuggestions() {
  const role = sessionStorage.getItem("userRole");
  if (role !== "責任者" && role !== "管理者") {
    document.getElementById("aiSuggestions").style.display = "none";
    return;
  }

  document.getElementById("suggestionList").innerHTML = `
    <li>商品Aは3週間売れていません。価格見直しを検討してください。</li>
    <li>今週は「文房具」カテゴリが売れやすい傾向です。</li>
    <li>商品Bの期限が近く、承認が未完了です。優先対応を推奨します。</li>
  `;
}

// ✅ 権限によるUI制御
function controlUIByRole() {
  const role = sessionStorage.getItem("userRole");
  if (!role) return;

  if (role === "責任者" || role === "管理者") {
    document.getElementById("calendarButton")?.style.display = "inline-block";
    document.getElementById("fleamarketButton")?.style.display = "inline-block";
    document.getElementById("aiButton")?.style.display = "inline-block";
  }

  if (role === "管理者") {
    document.getElementById("adminButton")?.style.display = "inline-block";
  }
}

// ✅ メニュー展開（左配置対応）
function toggleMenu() {
  const menu = document.getElementById("hamburgerMenu");
  if (!menu) return;
  menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "block" : "none";
}

// ✅ 画面遷移
function goToRegister() { window.location.href = "register.html"; }
function goToList() { window.location.href = "list.html"; }
function goToFleamarket() { window.location.href = "fleamarket.html"; }
function goToCalendar() {
  window.location.href = "calendar.html";
}
function goToSettings() {
  window.location.href = "settings.html";
}
function goToAdmin() {
  window.location.href = "admin.html";
}
function goToImprovementAI() {
  window.location.href = "ai.html";
}