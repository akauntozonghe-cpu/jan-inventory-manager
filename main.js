// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM取得
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginBtn = document.getElementById("loginBtn");
const loginId = document.getElementById("loginId");
const loginError = document.getElementById("loginError");
const userBadge = document.getElementById("userBadge");

// ログイン処理
loginBtn.addEventListener("click", async () => {
  const id = loginId.value.trim();
  if (!id) return (loginError.textContent = "IDを入力してください");

  const snapshot = await db.collection("users").where("id", "==", id).get();
  if (snapshot.empty) {
    loginError.textContent = "IDが見つかりません";
    return;
  }

  const user = snapshot.docs[0].data();
  sessionStorage.setItem("userId", user.id);
  sessionStorage.setItem("userName", user.name);
  sessionStorage.setItem("role", user.role);

  document.body.classList.toggle("admin", user.role === "admin");
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  userBadge.textContent = `${user.name}（${user.role}）`;

  await db.collection("logs").add({
    type: "login",
    userId: user.id,
    userName: user.name,
    role: user.role,
    timestamp: new Date().toISOString()
  });

  routeTo("homeSection");
});
// 画面切替処理
const routeTo = (sectionId) => {
  document.querySelectorAll("section.content").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");
};

// メニュー操作
document.querySelectorAll("#sideMenu li").forEach(item => {
  item.addEventListener("click", () => {
    const target = item.dataset.route;
    if (target) routeTo(target);
    document.getElementById("sideMenu").classList.add("hidden");
  });
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sideMenu").classList.toggle("hidden");
});

// トースト通知
const showToast = (message) => {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
};

// 商品登録処理
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const uid = sessionStorage.getItem("userId");
  const role = sessionStorage.getItem("role");

  const product = {
    productName: document.getElementById("productName").value.trim(),
    janCode: document.getElementById("janCode").value.trim(),
    adminCode: document.getElementById("adminCode").value.trim(),
    adminCategoryCode: role === "admin" ? document.getElementById("adminCategoryCode").value.trim() : "",
    company: document.getElementById("company").value.trim(),
    location: document.getElementById("location").value.trim(),
    unit: document.getElementById("unit").value.trim(),
    quantity: parseInt(document.getElementById("quantity").value) || 0,
    expire: document.getElementById("expire").value,
    lotNumber: document.getElementById("lotNumber").value.trim(),
    category: {
      major: document.getElementById("majorCategory").value,
      minor: document.getElementById("minorCategory").value.trim()
    },
    status: "pending",
    createdBy: uid,
    createdAt: new Date().toISOString()
  };

  await db.collection("products").add(product);

  await db.collection("logs").add({
    type: "register",
    userId: uid,
    productName: product.productName,
    timestamp: new Date().toISOString()
  });

  showToast("商品を登録しました");
  e.target.reset();
});
// 商品検索処理
document.getElementById("searchBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("searchKeyword").value.trim();
  const status = document.getElementById("searchStatus").value;
  const major = document.getElementById("searchMajor").value;
  const minor = document.getElementById("searchMinor").value.trim();
  const isAdmin = sessionStorage.getItem("role") === "admin";

  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const filtered = products.filter(p => {
    const matchKeyword = keyword ? (p.productName?.includes(keyword) || p.janCode?.includes(keyword)) : true;
    const matchStatus = status ? p.status === status : true;
    const matchMajor = major ? p.category?.major === major : true;
    const matchMinor = minor ? p.category?.minor?.includes(minor) : true;
    return matchKeyword && matchStatus && matchMajor && matchMinor;
  });

  const list = document.getElementById("searchResultList");
  list.innerHTML = "";

  filtered.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${p.productName}</strong>（${p.quantity}個）<br>
      ${isAdmin ? `<button class="editBtn" data-id="${p.id}">編集</button>` : ""}
      ${isAdmin && p.status === "pending" ? `<button class="approveBtn" data-id="${p.id}">承認</button>` : ""}
      <button class="changeQtyBtn" data-id="${p.id}">個数変更</button>
    `;
    list.appendChild(li);
  });
});

// 編集処理（管理者のみ）
document.getElementById("searchResultList").addEventListener("click", async (e) => {
  if (e.target.classList.contains("editBtn")) {
    const id = e.target.dataset.id;
    const doc = await db.collection("products").doc(id).get();
    const data = doc.data();
    const newQty = prompt(`数量を変更（現在: ${data.quantity}）`, data.quantity);
    if (newQty !== null) {
      await db.collection("products").doc(id).update({ quantity: parseInt(newQty) });
      await db.collection("logs").add({
        type: "edit",
        userId: sessionStorage.getItem("userId"),
        productId: id,
        changes: { quantity: newQty },
        timestamp: new Date().toISOString()
      });
      showToast("数量を更新しました");
    }
  }

  // 承認処理（管理者のみ）
  if (e.target.classList.contains("approveBtn")) {
    const id = e.target.dataset.id;
    await db.collection("products").doc(id).update({ status: "approved" });
    await db.collection("logs").add({
      type: "approve",
      userId: sessionStorage.getItem("userId"),
      productId: id,
      timestamp: new Date().toISOString()
    });
    showToast("商品を承認しました");
  }

  // 個数変更（全ユーザー）
  if (e.target.classList.contains("changeQtyBtn")) {
    const id = e.target.dataset.id;
    const doc = await db.collection("products").doc(id).get();
    const data = doc.data();
    const newQty = prompt(`数量を変更（現在: ${data.quantity}）`, data.quantity);
    if (newQty !== null) {
      await db.collection("products").doc(id).update({ quantity: parseInt(newQty) });
      await db.collection("logs").add({
        type: "changeQty",
        userId: sessionStorage.getItem("userId"),
        productId: id,
        changes: { quantity: newQty },
        timestamp: new Date().toISOString()
      });
      showToast("数量を変更しました");
    }
  }
});
// 操作履歴表示
const logList = document.getElementById("logList");
document.querySelector('[data-route="historySection"]').addEventListener("click", async () => {
  const logs = await db.collection("logs").orderBy("timestamp", "desc").limit(50).get();
  logList.innerHTML = "";
  logs.forEach(doc => {
    const log = doc.data();
    const li = document.createElement("li");
    li.textContent = `${new Date(log.timestamp).toLocaleString("ja-JP")} - ${log.userName || log.userId} が ${log.type} を実行`;
    logList.appendChild(li);
  });
});

// フリマ出品処理
document.getElementById("marketForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const item = {
    productName: document.getElementById("marketProductName").value.trim(),
    price: parseInt(document.getElementById("marketPrice").value),
    condition: document.getElementById("marketCondition").value,
    sellerId: sessionStorage.getItem("userId"),
    createdAt: new Date().toISOString()
  };
  await db.collection("marketItems").add(item);
  await db.collection("marketLogs").add({
    type: "list",
    sellerId: item.sellerId,
    productName: item.productName,
    timestamp: item.createdAt
  });
  showToast("出品しました");
  e.target.reset();
});

// 設定画面：ダークモード・通知切替
document.getElementById("darkModeToggle").addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

document.getElementById("toastToggle").addEventListener("change", (e) => {
  document.body.dataset.toast = e.target.checked ? "on" : "off";
});

// 管理者設定保存（プリセット）
document.getElementById("saveAdminSettings").addEventListener("click", () => {
  const preset = document.getElementById("adminPresetCategory").value.trim();
  if (preset) {
    localStorage.setItem("adminPresetCategory", preset);
    showToast("管理プリセットを保存しました");
  }
});

// 問題報告処理
document.getElementById("alertForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alert = {
    screen: document.getElementById("alertScreen").value.trim(),
    message: document.getElementById("alertMessage").value.trim(),
    userId: sessionStorage.getItem("userId"),
    timestamp: new Date().toISOString()
  };
  await db.collection("alerts").add(alert);
  showToast("問題を報告しました");
  e.target.reset();
});

// ログアウト処理
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const uid = sessionStorage.getItem("userId");
  await db.collection("logs").add({
    type: "logout",
    userId: uid,
    timestamp: new Date().toISOString()
  });
  sessionStorage.clear();
  location.reload();
});
