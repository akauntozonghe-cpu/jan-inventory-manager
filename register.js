// 管理者表示制御（ヘッダーの情報を利用）
const responsibleUser = document.getElementById("responsibleUser");
const adminOnlyField = document.getElementById("adminOnlyField");

// ヘッダー情報がセットされるまで待つ関数
function waitForUserInfo(callback) {
  const interval = setInterval(() => {
    if (window.currentUserInfo) {
      clearInterval(interval);
      callback(window.currentUserInfo);
    }
  }, 200);
}

auth.onAuthStateChanged((user) => {
  if (user && adminOnlyField) {
    waitForUserInfo((info) => {
      const role = info.role || "未設定";
      const name = info.name || "不明";

      console.log("ログインユーザー:", name, "role:", role);

      if (responsibleUser) {
        responsibleUser.textContent = `👑 ${name}（${role}）`;
      }
      adminOnlyField.style.display = role === "管理者" ? "block" : "none";
    });
  } else if (adminOnlyField) {
    adminOnlyField.style.display = "none";
  }
});