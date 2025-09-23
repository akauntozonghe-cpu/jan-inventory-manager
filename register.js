// 管理者表示制御
const responsibleUser = document.getElementById("responsibleUser");
const adminOnlyField = document.getElementById("adminOnlyField");

auth.onAuthStateChanged(async (user) => {
  if (user && adminOnlyField) {
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.data();
      const name = (userData?.name || "不明").trim();
      const role = (userData?.role || "未設定").trim(); // ← trimで余分な空白を除去

      console.log("ログインユーザー:", name, "role:", role); // デバッグ出力

      if (responsibleUser) {
        responsibleUser.textContent = `👑 ${name}（${role}）`;
      }

      // 管理者だけに専用領域を表示
      if (role === "管理者") {
        adminOnlyField.style.display = "block";
      } else {
        adminOnlyField.style.display = "none";
      }
    } catch (err) {
      console.error("ユーザー情報取得失敗:", err);
      if (responsibleUser) {
        responsibleUser.textContent = "👑 ログイン中：取得失敗";
      }
      adminOnlyField.style.display = "none";
    }
  } else if (adminOnlyField) {
    adminOnlyField.style.display = "none";
  }
});