const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  appId: "1:245219344089:web:e46105927c302e6a5788c8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function showCustomAlert(message) {
  document.getElementById("alertMessage").textContent = message;
  document.getElementById("customAlert").classList.remove("hidden");
}
function closeCustomAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}

function updateTime() {
  const now = new Date();
  const days = ['日','月','火','水','木','金','土'];
  const formatted = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}) ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  document.getElementById("datetime").textContent = formatted;
}
updateTime();
setInterval(updateTime, 60000);

async function fetchUserInfo(uid) {
  try {
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      showCustomAlert("責任者情報が登録されていません");
      return;
    }
    const user = snap.data();
    document.getElementById("userInfo").textContent =
      `責任者：${user.name}（権限: ${user.role}）`;
  } catch (error) {
    showCustomAlert("責任者情報の取得に失敗しました：" + error.message);
  }
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const
