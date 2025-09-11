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
  const unit = document.getElementById("unit").value;
  const categorySmall = document.getElementById("categorySmall").value;
  const lotNo = document.getElementById("lotNo").value;
  const expiry = document.getElementById("expiry").value;
  const maker = document.getElementById("maker").value;
  const adminCode = document.getElementById("adminCode").value;
  const jan = document.getElementById("janCode").value;
  const qty = parseInt(document.getElementById("quantity").value);
  const loc = document.getElementById("location").value;
  const user = firebase.auth().currentUser?.displayName || "匿名ユーザー";
  const timestamp = new Date();
  const loc = document.getElementById("location").value;

  if (!name || !jan || !qty || !loc || !categorySmall || !unit) {
  return alert("必須項目が未入力です");
}

  await db.collection("products").add({
  name,
  jan,
  qty,
  unit,
  loc,
  categoryLarge,
  categorySmall,
  lotNo,
  expiry,
  maker,
  adminCode,
  registeredBy: user,
  registeredAt: timestamp,
  updatedAt: timestamp
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
li.innerHTML = `
  管理番号：${doc.id}<br>
  ${data.name}（${data.qty}${data.unit}）＠${data.loc}<br>
  分類：${data.categoryLarge || "未設定"}／${data.categorySmall || "未設定"}<br>
  <small>最終更新：${formatDate(data.updatedAt?.toDate?.())}</small><br>
  <button class="editRequestBtn" data-id="${doc.id}">編集申請</button>
  ＠${data.loc}
`; 
 ;   list.appendChild(li);
  });
}
loadProducts();

// 🔽 ここから貼り付けてOK
let currentProductId = null;

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("editRequestBtn")) {
    currentProductId = e.target.dataset.id;
    document.getElementById("editModal").classList.remove("hidden");
  }
});

function closeModal() {
  document.getElementById("editModal").classList.add("hidden");
}

const categoryOptions = ["衣類", "食品", "雑貨", "衛生用品"];
document.getElementById("editField").addEventListener("change", () => {
  const field = document.getElementById("editField").value;
  const area = document.getElementById("editInputArea");
  area.innerHTML = "";

  if (field === "categoryLarge") {
    const select = document.createElement("select");
    select.id = "newValue";
    categoryOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    area.appendChild(select);
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "newValue";
    input.placeholder = "新しい値";
    area.appendChild(input);
  }
});

document.getElementById("submitEditRequest").addEventListener("click", async () => {
  const field = document.getElementById("editField").value;
  const afterValue = document.getElementById("newValue").value;
  const user = firebase.auth().currentUser?.displayName || "匿名ユーザー";
  const timestamp = new Date();

  if (!currentProductId || !field || !afterValue) return alert("すべて入力してください");

  const productRef = db.collection("products").doc(currentProductId);
  const productSnap = await productRef.get();
  const beforeValue = productSnap.data()[field];

  await db.collection("requests").add({
    productId: currentProductId,
    field,
    beforeValue,
    afterValue,
    requestedBy: user,
    requestedAt: timestamp,
    status: "pending"
    loc,
  });

  closeModal();
  alert("申請を送信しました");
});
// Firebase Auth（匿名ログイン）
firebase.auth().signInAnonymously().then(() => {
  document.getElementById("userInfo").textContent = "責任者：匿名ユーザー";
});




