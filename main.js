const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.firebasestorage.app",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 日時表示（リアルタイム更新）
function updateTime() {
  const now = new Date();
  const days = ['日','月','火','水','木','金','土'];
  const formatted = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${days[now.getDay()]}）${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  document.getElementById("datetime").textContent = formatted;
}
updateTime();
setInterval(updateTime, 60000);

// タイトルクリックでホーム（リロード）
document.getElementById("title").addEventListener("click", () => location.reload());

// 商品登録処理
document.getElementById("registerBtn").addEventListener("click", async () => {
  const name = document.getElementById("productName").value;
  const jan = document.getElementById("janCode").value;
  const qty = parseInt(document.getElementById("quantity").value);
  const loc = document.getElementById("location").value;
  const user = firebase.auth().currentUser?.displayName || "匿名ユーザー";
  const timestamp = new Date();

  if (!name || !jan || !qty || !loc) return alert("すべて入力してください");

  await db.collection("products").add({
    name, jan, qty, loc, registeredBy: user, registeredAt: timestamp
  });

  loadProducts();
});

// 商品一覧表示
async function loadProducts() {
  const list = document.getElementById("productList");
  list.innerHTML = "";
  const snapshot = await db.collection("products").orderBy("registeredAt", "desc").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.name}（${data.qty}個）＠${data.loc}`;
    list.appendChild(li);
  });
}
loadProducts();

// Firebase Auth（匿名ログイン）
firebase.auth().signInAnonymously().then(() => {
  document.getElementById("userInfo").textContent = "責任者：匿名ユーザー";
});
