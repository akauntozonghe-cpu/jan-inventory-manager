const uid = localStorage.getItem("uid");
const usersRef = collection(db, "users");
const snapshot = await getDocs(query(usersRef, where("uid", "==", uid)));

if (snapshot.empty) {
  alert("ユーザー情報が見つかりません。");
  window.location.href = "login.html";
}

const userData = snapshot.docs[0].data();
const { role } = userData;

if (role !== "管理者") {
  alert("この画面は管理者専用です。");
  window.location.href = "home.html";
}

// 全履歴表示（例：actionLogs）
const logsRef = collection(db, "actionLogs");
onSnapshot(logsRef, (snapshot) => {
  const list = document.getElementById("adminActionList");
  list.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const time = data.timestamp.toDate().toLocaleString("ja-JP");
    const li = document.createElement("li");
    li.textContent = `🧾 ${data.performedBy} が ${data.action}（${time}）`;
    list.appendChild(li);
  });
});