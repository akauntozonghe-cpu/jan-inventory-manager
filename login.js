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

  const input = document.getElementById("userIdInput");
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") login();
  });
};

// 秒付き現在時刻表示
function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}) `
    + `${now.getHours().toString().padStart(2, "0")}:`
    + `${now.getMinutes().toString().padStart(2, "0")}:`
    + `${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `${formatted}`;
}

// ログイン処理
async function login() {
  const userId = document.getElementById("userIdInput").value.trim();
  const status = document.getElementById("loginStatus");

  if (!userId) {
    status.textContent = "責任者番号を入力してください。";
    return;
  }

  try {
    const snapshot = await db.collection("users").where("id", "==", userId).get();
    if (snapshot.empty) {
      status.textContent = "登録された番号が見つかりません。";
      return;
    }

    const doc = snapshot.docs[0];
    const userData = doc.data();

    // セッション保存
    sessionStorage.setItem("userId", userId);
    sessionStorage.setItem("userName", userData.name);
    sessionStorage.setItem("userRole", userData.role);

    // Firestoreにログイン履歴記録
    const now = new Date();
    await db.collection("users").doc(doc.id).update({
      lastLogin: firebase.firestore.Timestamp.fromDate(now)
    });

    // ホーム画面へ遷移
    window.location.href = "home.html";
  } catch (error) {
    console.error("ログインエラー:", error);
    status.textContent = "ログイン中にエラーが発生しました。";
  }
}