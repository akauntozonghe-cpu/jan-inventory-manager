// Firebase 初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ユーティリティ
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function toast(msg, type = "info") {
  const host = $("#toastHost");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  host.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => t.classList.remove("show"), 2200);
  setTimeout(() => t.remove(), 2600);
}

async function logAction(action, detail = {}) {
  const id = sessionStorage.getItem("responsibilityId");
  const name = sessionStorage.getItem("responsibilityName");
  const role = sessionStorage.getItem("responsibilityRole");
  try {
    await addDoc(collection(db, "logs"), {
      userId: id,
      userName: name,
      role,
      action,
      detail,
      timestamp: new Date()
    });
  } catch (e) {
    console.warn("ログ記録に失敗:", e);
  }
}

// 画面制御
const loginView = $("#loginView");
const appView = $("#appView");

// ログインEnter対応
const loginInput = $("#responsibilityId");
const loginBtn = $("#loginBtn");
if (loginInput && loginBtn) {
  loginInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
}

// ログイン処理
if (loginBtn) {
  loginBtn.onclick = async () => {
    const id = loginInput.value.trim();
    if (!id) {
      loginInput.classList.add("is-invalid");
      setTimeout(() => loginInput.classList.remove("is-invalid"), 800);
      return toast("責任者番号を入力してください", "error");
    }

    try {
      // users: { id, name, role }
      const qy = query(collection(db, "users"), where("id", "==", id));
      const snap = await getDocs(qy);
      if (snap.empty) {
        return toast("番号が見つかりません", "error");
      }
      const data = snap.docs[0].data();
      sessionStorage.setItem("responsibilityId", id);
      sessionStorage.setItem("responsibilityName", data.name);
      sessionStorage.setItem("responsibilityRole", data.role);

      await logAction("ログイン");
      toast("ログイン成功", "success");

      // 画面遷移（SPA切替）
      showApp();
    } catch (e) {
      console.error(e);
      toast("ログイン処理に失敗しました", "error");
    }
  };
}

// 初期表示（セッションがあればアプリ画面から）
if (sessionStorage.getItem("responsibilityName")) {
  showApp();
}

// アプリ画面初期化
function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  initHeader();
  initMenu();
  initProductForm();
  initList();
  routeTo("productSection");
}

// ヘッダー（氏名・ロール表示）
function initHeader() {
  const name = sessionStorage.getItem("responsibilityName") || "未設定";
  const role = sessionStorage.getItem("responsibilityRole") || "user";
  $("#responsibilityName").textContent = name;
  const roleBadge = $("#responsibilityRole");
  roleBadge.textContent = role === "admin" ? "管理者" : "責任者";
  roleBadge.classList.remove("admin", "user");
  roleBadge.classList.add(role);

  // 管理者専用UIの表示切替
  $$(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", role !== "admin");
  });
}

// メニュー
function initMenu() {
  const hamburger = $("#hamburgerMenu");
  const sideMenu = $("#sideMenu");
  hamburger.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
  });

  $$(".nav-item[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      routeTo(btn.dataset.target);
      sideMenu.classList.remove("open");
    });
  });

  $("#logoutBtn").addEventListener("click", () => {
    const name = sessionStorage.getItem("responsibilityName");
    sessionStorage.clear();
    toast(`${name || "ユーザー"} をログアウトしました`, "success");
    location.reload();
  });
}

function routeTo(panelId) {
  $$(".panel").forEach((p) => p.classList.add("hidden"));
  const target = `#${panelId}`;
  const el = $(target);
  if (el) el.classList.remove("hidden");
}

// 商品登録
function initProductForm() {
  const inputs = [
    "#mgtNo", "#mgtDistNo", "#location", "#catL", "#catS",
    "#jan", "#company", "#productName", "#lotNo", "#expire", "#qty"
  ];
  const registerBtn = $("#registerBtn");
  const photoInput = $("#photo");

  // Enterで登録（フォーム内の最後の主要フィールドでEnter → 登録）
  inputs.forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") registerBtn.click();
    });
  });

  // バーコードスキャン（対応ブラウザのみ）
  const scanBtn = $("#scanBtn");
  const scanPreview = $("#scanPreview");
  let stream = null;

  scanBtn.addEventListener("click", async () => {
    const hasBarcodeDetector = "BarcodeDetector" in window;
    if (!hasBarcodeDetector) {
      toast("バーコードスキャン非対応のため手入力をご利用ください", "error");
      return;
    }
    try {
      const BarcodeDetector = window.BarcodeDetector;
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_e"] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      scanPreview.srcObject = stream;
      scanPreview.classList.remove("hidden");
      await scanPreview.play();

      // 簡易スキャンループ
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let active = true;

      const loop = async () => {
        if (!active) return;
        canvas.width = scanPreview.videoWidth;
        canvas.height = scanPreview.videoHeight;
        ctx.drawImage(scanPreview, 0, 0, canvas.width, canvas.height);
        const bitmap = await createImageBitmap(canvas);
        try {
          const codes = await detector.detect(bitmap);
          if (codes && codes.length) {
            const code = codes[0].rawValue;
            $("#jan").value = code;
            toast(`JAN検出: ${code}`, "success");
            stopScan();
            return;
          }
        } catch {}
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      function stopScan() {
        active = false;
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
        }
        scanPreview.pause();
        scanPreview.srcObject = null;
        scanPreview.classList.add("hidden");
      }

      // もう一度押すと停止
      const onceStop = () => {
        stopScan();
        scanBtn.removeEventListener("click", onceStop);
      };
      scanBtn.addEventListener("click", onceStop);
    } catch (e) {
      console.error(e);
      toast("カメラの起動に失敗しました", "error");
    }
  });

  registerBtn.addEventListener("click", async () => {
    const role = sessionStorage.getItem("responsibilityRole") || "user";

    const product = {
      mgtNo: $("#mgtNo").value.trim(),
      mgtDistNo: $("#mgtDistNo").value.trim(), // 管理者のみ保存旨はサーバー側ルールでも制御推奨
      location: $("#location").value.trim(),
      catL: $("#catL").value.trim(),
      catS: $("#catS").value.trim(),
      jan: $("#jan").value.trim(),
      company: $("#company").value.trim(),
      productName: $("#productName").value.trim(),
      lotNo: $("#lotNo").value.trim(),
      expire: $("#expire").value ? new Date($("#expire").value).toISOString().slice(0, 10) : "",
      qty: Number($("#qty").value || 0),
      qtyUnit: $("#qtyUnit").value,
      photoUrl: "",
      createdBy: sessionStorage.getItem("responsibilityName"),
      createdAt: new Date(),
    };

    // 必須チェック（最低限）
    if (!product.mgtNo || !product.productName) {
      highlightInvalid(["#mgtNo", "#productName"]);
      return toast("管理番号と品名は必須です", "error");
    }

    // 管理者でない場合は管理区別番号を保存しない（UI非表示でも改ざん対策）
    if (role !== "admin") product.mgtDistNo = "";

    // 画像アップロード（任意）
    const file = photoInput.files && photoInput.files[0];
    if (file) {
      try {
        const key = `products/${product.mgtNo}/${Date.now()}_${file.name}`;
        const r = sRef(storage, key);
        await uploadBytes(r, file);
        product.photoUrl = await getDownloadURL(r);
      } catch (e) {
        console.warn("画像アップロード失敗", e);
        toast("画像のアップロードに失敗しました（後で再試行可）", "error");
      }
    }

    try {
      // products: ドキュメントID = 管理番号（ユニーク運用）
      await setDoc(doc(db, "products", product.mgtNo), product);
      toast("商品を登録しました", "success");
      await logAction("商品登録", { mgtNo: product.mgtNo, jan: product.jan, qty: product.qty, unit: product.qtyUnit });
      clearProductForm();
      await loadProducts(); // 一覧更新
      routeTo("listSection");
    } catch (e) {
      console.error(e);
      toast("商品の登録に失敗しました", "error");
    }
  });
}

function highlightInvalid(selectors) {
  selectors.forEach((s) => {
    const el = $(s);
    if (!el) return;
    if (!el.value?.trim()) {
      el.classList.add("is-invalid");
      setTimeout(() => el.classList.remove("is-invalid"), 800);
    }
  });
}

function clearProductForm() {
  ["#mgtNo","#mgtDistNo","#location","#catL","#catS","#jan","#company","#productName","#lotNo","#expire","#qty","#photo"].forEach((s) => {
    const el = $(s);
    if (!el) return;
    if (el.type === "file") el.value = "";
    else el.value = "";
  });
  $("#qtyUnit").value = "個";
}

// 商品一覧（簡易クライアントページング）
let allProducts = [];
let page = 1;
const pageSize = 10;

function initList() {
  // Enterで検索
  $("#filterText").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#filterBtn").click(); });
  $("#filterJan").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#filterBtn").click(); });

  $("#filterBtn").addEventListener("click", () => applyFilters());
  $("#clearFilterBtn").addEventListener("click", async () => {
    $("#filterText").value = "";
    $("#filterJan").value = "";
    await loadProducts();
    renderList();
  });

  // スキャン（一覧用）
  const filterScanBtn = $("#filterScanBtn");
  filterScanBtn.addEventListener("click", async () => {
    if (!("BarcodeDetector" in window)) {
      toast("スキャン非対応のため手入力をご利用ください", "error");
      return;
    }
    try {
      // 簡易的にカメラ→バーコード検出は登録画面の実装を流用推奨（省略）
      toast("登録画面のスキャン機能をご利用ください", "info");
    } catch {}
  });

  $("#prevPage").addEventListener("click", () => {
    if (page > 1) { page--; renderList(); }
  });
  $("#nextPage").addEventListener("click", () => {
    const max = Math.max(1, Math.ceil(allProducts.length / pageSize));
    if (page < max) { page++; renderList(); }
  });

  loadProducts().then(renderList);
}

async function loadProducts() {
  // ここでは全件取得 → クライアントでページング（規模増はサーバーページングへ移行）
  const snap = await getDocs(collection(db, "products"));
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

function applyFilters() {
  page = 1;
  renderList();
}

function filterData() {
  const t = $("#filterText").value.trim().toLowerCase();
  const j = $("#filterJan").value.trim();
  return allProducts.filter(p => {
    const hitText = !t || [p.company, p.productName, p.mgtNo, p.location, p.catL, p.catS].some(v => (v||"").toLowerCase().includes(t));
    const hitJan = !j || (p.jan||"").includes(j);
    return hitText && hitJan;
  });
}

function renderList() {
  const role = sessionStorage.getItem("responsibilityRole") || "user";
  const list = $("#listContainer");
  const data = filterData();
  const max = Math.max(1, Math.ceil(data.length / pageSize));
  page = Math.min(page, max);
  const start = (page - 1) * pageSize;
  const view = data.slice(start, start + pageSize);

  list.innerHTML = "";
  view.forEach(p => {
    const row = document.createElement("div");
    row.className = "list-row";

    const head = document.createElement("div");
    head.className = "row-head";
    head.innerHTML = `
      <div class="row-main">
        <strong>${escapeHtml(p.productName || "-")}</strong>
        <span class="muted">（${escapeHtml(p.company || "-")}）</span>
      </div>
      <div class="row-sub">
        管理番号: ${escapeHtml(p.mgtNo || "-")} / JAN: ${escapeHtml(p.jan || "-")} / 個数: ${p.qty ?? 0} ${escapeHtml(p.qtyUnit || "")}
      </div>
      <button class="toggle">展開</button>
    `;

    const body = document.createElement("div");
    body.className = "row-body hidden";
    body.innerHTML = `
      <div class="kv">
        <div><span class="k">保管場所</span><span class="v">${escapeHtml(p.location || "-")}</span></div>
        <div><span class="k">大分類</span><span class="v">${escapeHtml(p.catL || "-")}</span></div>
        <div><span class="k">小分類</span><span class="v">${escapeHtml(p.catS || "-")}</span></div>
        ${ role === "admin" ? `<div><span class="k">管理区別番号</span><span class="v">${escapeHtml(p.mgtDistNo || "-")}</span></div>` : "" }
        <div><span class="k">Lot/製造番号</span><span class="v">${escapeHtml(p.lotNo || "-")}</span></div>
        <div><span class="k">期限</span><span class="v">${escapeHtml(p.expire || "-")}</span></div>
        ${ p.photoUrl ? `<div class="photo"><img src="${p.photoUrl}" alt="商品写真" /></div>` : "" }
      </div>
      <div class="row-actions">
        <label>個数変更：
          <input type="number" class="qty-input" min="0" step="1" value="${p.qty ?? 0}" />
          <span>${escapeHtml(p.qtyUnit || "")}</span>
        </label>
        <button class="save-qty primary">保存</button>
        ${ role === "admin" ? `<button class="edit secondary">編集</button>` : "" }
      </div>
    `;

    head.querySelector(".toggle").addEventListener("click", () => {
      body.classList.toggle("hidden");
    });

    body.querySelector(".save-qty").addEventListener("click", async () => {
      const qtyEl = body.querySelector(".qty-input");
      const newQty = Number(qtyEl.value || 0);
      try {
        const ref = doc(db, "products", p.mgtNo);
        const cur = await getDoc(ref);
        if (cur.exists()) {
          const data = cur.data();
          await setDoc(ref, { ...data, qty: newQty }, { merge: true });
          toast("個数を更新しました", "success");
          await logAction("個数変更", { mgtNo: p.mgtNo, from: p.qty ?? 0, to: newQty });
          p.qty = newQty;
          renderList();
        }
      } catch (e) {
        console.error(e);
        toast("個数の更新に失敗しました", "error");
      }
    });

    if (role === "admin") {
      body.querySelector(".edit")?.addEventListener("click", () => {
        toast("編集UIは今後追加（暫定）", "info");
      });
    }

    row.appendChild(head);
    row.appendChild(body);
    list.appendChild(row);
  });

  $("#pageInfo").textContent = `${page} / ${max || 1}`;
}

function escapeHtml(s) {
  return (s ?? "").toString().replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
