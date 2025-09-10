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
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = user.role === "admin" ? "block" : "none";
  });

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

// タイトルバーに日時表示
function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
  document.getElementById("titleHeader").textContent = `在庫管理（${formatted}）`;
}
setInterval(updateDateTime, 60000);
updateDateTime();

// タイトルクリックでホームへ戻る
document.getElementById("titleHeader").addEventListener("click", () => {
  routeTo("homeSection");
});

// メニュー開閉＋外部クリックで閉じる
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sideMenu").classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  const menu = document.getElementById("sideMenu");
  const toggle = document.getElementById("menuToggle");
  if (!menu.classList.contains("hidden") && !menu.contains(e.target) && e.target !== toggle) {
    menu.classList.add("hidden");
  }
});

// Enterキー送信対応（全フォーム）
["productForm", "alertForm", "marketForm"].forEach(formId => {
  const form = document.getElementById(formId);
  form?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.querySelector("button[type='submit']")?.click();
    }
  });
});
// 画面切替処理
const routeTo = (sectionId) => {
  document.querySelectorAll("section.content").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");
};

// ホーム画面の可視化
async function renderHomeDashboard() {
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map(doc => doc.data());

  const total = products.length;
  const approved = products.filter(p => p.status === "approved").length;
  const expired = products.filter(p => new Date(p.expire) < new Date()).length;
  const soon = products.filter(p => {
    const d = new Date(p.expire);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  document.getElementById("summaryStats").innerHTML = `
    <p>登録：${total}件 / 承認済：${approved}件 / 期限切れ：${expired}件</p>
  `;

  document.getElementById("expiringSoon").innerHTML = `
    <h4>期限間近の商品</h4>
    <ul>${soon.map(p => `<li>${p.productName}（${p.expire}）</li>`).join("")}</ul>
  `;

  const marketSnap = await db.collection("marketItems").orderBy("createdAt", "desc").limit(5).get();
  const marketHtml = marketSnap.docs.map(doc => {
    const item = doc.data();
    return `<li>${item.productName}（¥${item.price} / ${item.condition}）</li>`;
  }).join("");
  document.getElementById("topProducts").innerHTML = `
    <h4>最新フリマ出品</h4>
    <ul>${marketHtml}</ul>
  `;
}
document.querySelector('[data-route="homeSection"]').addEventListener("click", renderHomeDashboard);
window.addEventListener("load", renderHomeDashboard);

// トースト通知表示
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast-${type}`;
  if (document.body.dataset.toast !== "off") {
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }
}

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

  showToast("商品を登録しました", "success");
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

  const initialCount = 10;
  const visible = filtered.slice(0, initialCount);
  const hidden = filtered.slice(initialCount);

  visible.forEach(p => list.appendChild(createProductItem(p, isAdmin)));

  if (hidden.length > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.textContent = `＋ ${hidden.length}件を表示`;
    moreBtn.addEventListener("click", () => {
      hidden.forEach(p => list.appendChild(createProductItem(p, isAdmin)));
      moreBtn.remove();
    });
    list.appendChild(moreBtn);
  }
});

function createProductItem(p, isAdmin) {
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${p.productName}</strong>（${p.quantity}個）<br>
    ${isAdmin ? `<button class="editBtn" data-id="${p.id}">編集</button>` : ""}
    ${isAdmin && p.status === "pending" ? `<button class="approveBtn" data-id="${p.id}">承認</button>` : ""}
    <button class="changeQtyBtn" data-id="${p.id}">個数変更</button>
  `;
  return li;
}

// 編集・承認・個数変更
document.getElementById("searchResultList").addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  const doc = await db.collection("products").doc(id).get();
  const data = doc.data();

  if (e.target.classList.contains("editBtn")) {
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
      showToast("数量を更新しました", "success");
    }
  }

  if (e.target.classList.contains("approveBtn")) {
    await db.collection("products").doc(id).update({ status: "approved" });
    await db.collection("logs").add({
      type: "approve",
      userId: sessionStorage.getItem("userId"),
      productId: id,
      timestamp: new Date().toISOString()
    });
    showToast("商品を承認しました", "success");
  }

  if (e.target.classList.contains("changeQtyBtn")) {
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
      showToast("数量を変更しました", "success");
    }
  }
});

// フリマ出品
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
  showToast("出品しました", "success");
  e.target.reset();
});

// 設定画面
document.getElementById("darkModeToggle").addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});
document.getElementById("toastToggle").addEventListener("change", (e) => {
  document.body.dataset.toast = e.target.checked ? "on" : "off";
});
document.getElementById("saveAdminSettings").addEventListener("click", () => {
  const preset = document.getElementById("adminPresetCategory").value.trim();
  if (preset) {
    localStorage.setItem("adminPresetCategory", preset);
    showToast("管理プリセットを保存しました", "success");
  }
});

// 問題報告
document.getElementById("alertForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alert = {
    screen: document.getElementById("alertScreen").value.trim(),
    message: document.getElementById("alertMessage").value.trim(),
    userId: sessionStorage.getItem("userId"),
    timestamp: new Date().toISOString()
  };
  await db.collection("alerts").add(alert);
  showToast("問題を報告しました", "success");
  e.target.reset();
});

// 管理者画面：未承認・履歴・報告一覧・CSV出力
document.querySelector('[data-route="adminSection"]').addEventListener("click", async () => {
  const pendingSnap = await db.collection("products").where("status", "==", "pending").get();
  const logSnap = await db.collection("logs").orderBy("timestamp", "desc").limit(50).get();
  const alertSnap = await db.collection("alerts").orderBy("timestamp", "desc").limit(20).get();

  const pendingList = document.getElementById("pendingList");
  const adminLogList = document.getElementById("adminLogList");
  const alertListAdmin = document.getElementById("alertListAdmin");

  pendingList.innerHTML = "";
  adminLogList.innerHTML = "";
  alertListAdmin.innerHTML = "";

  pendingSnap.forEach(doc => {
    const p = doc.data();
    pendingList.innerHTML += `<li>${p.productName}（${p.quantity}個）</li>`;
  });

  logSnap.forEach(doc => {
    const log = doc.data();
    adminLogList.innerHTML += `<li>${new Date(log.timestamp).toLocaleString("ja-JP")} - ${log.userName || log.userId} が ${log.type} を実行</li>`;
  });

  alertSnap.forEach(doc => {
    const alert = doc.data();
    alertListAdmin.innerHTML += `<li>${new Date(alert.timestamp).toLocaleString("ja-JP")} - ${alert.screen}：${alert.message}</li>`;
  });
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
