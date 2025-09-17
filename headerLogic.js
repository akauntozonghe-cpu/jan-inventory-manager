function startHeaderLogic() {
  // ⏱ 秒単位の現在時刻更新
  setInterval(() => {
    const now = new Date();
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
    const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${weekday}）` +
      ` ${now.getHours().toString().padStart(2, "0")}:` +
      `${now.getMinutes().toString().padStart(2, "0")}:` +
      `${now.getSeconds().toString().padStart(2, "0")}`;
    const clock = document.getElementById("clock");
    if (clock) clock.textContent = `⏱ 現在：${formatted}`;
  }, 1000);

  // 👑 ログイン資格と最終ログイン（ユーザー別）
  firebase.auth().onAuthStateChanged(async (user) => {
    const responsibleUser = document.getElementById("responsibleUser");
    const lastJudgment = document.getElementById("lastJudgment");
    const adminMenuItem = document.getElementById("adminMenuItem");

    if (user) {
      try {
        // ユーザー情報取得
        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const name = userData?.name || "不明";
        const role = userData?.role || "未設定";

        if (responsibleUser) {
          responsibleUser.textContent = `👑 ${name}（${role}）`;
        }

        if (role === "管理者" && adminMenuItem) {
          adminMenuItem.style.display = "block";
        }

        // 最終ログイン取得（uidで絞る）
        const snapshot = await firebase.firestore()
          .collection("loginLogs")
          .where("uid", "==", user.uid)
          .orderBy("timestamp", "desc")
          .limit(1)
          .get();

        if (!snapshot.empty && lastJudgment) {
          const log = snapshot.docs[0].data();
          const date = log.timestamp.toDate();
          const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
          const timeString = `${date.getMonth() + 1}月${date.getDate()}日（${weekday}）` +
            ` ${date.getHours().toString().padStart(2, "0")}:` +
            `${date.getMinutes().toString().padStart(2, "0")}:` +
            `${date.getSeconds().toString().padStart(2, "0")}`;
          lastJudgment.textContent = `🕒 最終ログイン：${timeString}`;
        }
      } catch (err) {
        if (responsibleUser) responsibleUser.textContent = "👑 ログイン中：取得失敗";
        if (lastJudgment) lastJudgment.textContent = "🕒 最終ログイン：取得失敗";
        if (adminMenuItem) adminMenuItem.style.display = "none";
      }
    } else {
      if (responsibleUser) responsibleUser.textContent = "👑 未ログイン";
      if (lastJudgment) lastJudgment.textContent = "🕒 最終ログイン：未取得";
      if (adminMenuItem) adminMenuItem.style.display = "none";
    }
  });
}

// ☰ メニュー開閉
function toggleMenu() {
  const menu = document.getElementById("headerMenu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
}

// 🚪 ログアウト処理
function logout() {
  firebase.auth().signOut().then(() => {
    alert("ログアウトしました");
    window.location.href = "index.html"; // 必要に応じて変更
  }).catch((error) => {
    console.error("ログアウト失敗:", error);
    alert("ログアウトに失敗しました");
  });
}