firebase.initializeApp({ /* config省略 */ });
const db = firebase.firestore();

window.onload = async function () {
  const name = sessionStorage.getItem("userName");
  const role = sessionStorage.getItem("userRole");
  const userId = sessionStorage.getItem("userId");

  const roleMap = { admin: "管理者", manager: "責任者", user: "一般ユーザー" };
  const roleJp = roleMap[role] || role;

  document.getElementById("userInfo").textContent = `${name}（${roleJp}）としてログイン中`;
  document.getElementById("currentTime").textContent = `現在日時：${new Date().toLocaleString("ja-JP", {
    hour: "2-digit", minute: "2-digit"
  })}`;

  await loadInventorySummary();

  if (role === "admin") {
    document.getElementById("adminList").classList.remove("hidden");
    await loadAdminList();
  }
};

function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("hidden");
}

async function loadInventorySummary() {
  const snapshot = await db.collection("products").get();
  const total = snapshot.size;
  const expired = snapshot.docs.filter(doc => {
    const limit = doc.data().期限;
    return limit && new Date(limit) < new Date();
  }).length;
  document.getElementById("summary").textContent = `登録商品数：${total}　期限切れ：${expired}`;
}

async function loadAdminList() {
  const snapshot = await db.collection("users").where("role", "==", "admin").get();
  const tbody = document.getElementById("adminTableBody");
  snapshot.forEach(doc => {
    const data = doc.data();
    tbody.innerHTML += `<tr><td>${data.name}</td><td>${data.id}</td><td>${data.fcmToken ? "✅" : "❌"}</td></tr>`;
  });
}
