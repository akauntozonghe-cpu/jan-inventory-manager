// Firebase 初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

const firebaseConfig = { /* ← 省略済み（前回の内容でOK） */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ユーティリティ
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function escapeHtml(s) {
  return (s ?? "").toString().replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }));
}
function toast(msg, type = "info") {
  const host = $("#toastHost");
  if (!host) return;
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
      userId: id, userName: name, role, action, detail, timestamp: new Date()
    });
  } catch (e) {
    console.warn("ログ記録に失敗:", e);
  }
}

// 画面制御
const loginView = $("#loginView");
const appView = $("#appView");
const loginInput = $("#responsibilityId");
const loginBtn = $("#loginBtn");

if (loginInput && loginBtn) {
  loginInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  loginBtn.onclick = async () => {
    const id = loginInput.value.trim();
    if (!id) {
      loginInput.classList.add("is-invalid");
      setTimeout(() => loginInput.classList.remove("is-invalid"), 800);
      return toast("責任者番号を入力してください", "error");
    }

    try {
      const qy = query(collection(db, "users"), where("id", "==", id));
      const snap = await getDocs(qy);
      if (snap.empty) return toast("番号が見つかりません", "error");

      const data = snap.docs[0].data();
      sessionStorage.setItem("responsibilityId", id);
      sessionStorage.setItem("responsibilityName", data.name || "未設定");
      sessionStorage.setItem("responsibilityRole", data.role || "user");

      await logAction("ログイン");
      toast("ログイン成功", "success");
      setTimeout(() => showApp(), 600);
    } catch (e) {
      console.error(e);
      toast("ログイン処理に失敗しました", "error");
    }
  };
}

if (sessionStorage.getItem("responsibilityName")) {
  showApp();
}

function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");

  setTimeout(() => {
    initHeader();
    initMenu();
    initProductForm();
    initList();
    routeTo("productSection");
  }, 0);
}

function initHeader() {
  const name = sessionStorage.getItem("responsibilityName") || "未設定";
  const role = sessionStorage.getItem("responsibilityRole") || "user";
  $("#responsibilityName").textContent = name;
  const roleBadge = $("#responsibilityRole");
  roleBadge.textContent = role === "admin" ? "管理者" : "責任者";
  roleBadge.classList.remove("admin", "user");
  roleBadge.classList.add(role);
  $$(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", role !== "admin");
  });
}

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

  $("#logoutBtn").addEventListener("click", async () => {
    const name = sessionStorage.getItem("responsibilityName");
    await logAction("ログアウト");
    sessionStorage.clear();
    toast(`${name || "ユーザー"} をログアウトしました`, "success");
    location.reload();
  });
}

function routeTo(panelId) {
  $$(".panel").forEach((p) => p.classList.add("hidden"));
  const el = $(`#${panelId}`);
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

  inputs.forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") registerBtn.click();
    });
  });

  const scanBtn = $("#scanBtn");
  const scanPreview = $("#scanPreview");
  let stream = null;

  scanBtn.addEventListener("click", async () => {
    if (stream) return stopScan();
    if (!("BarcodeDetector" in window)) {
      toast("バーコードスキャン非対応のため手入力をご利用ください", "error");
      return;
    }
    try {
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_e"] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      scanPreview.srcObject = stream;
      scanPreview.classList.remove("hidden");
      await scanPreview.play();

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
          if (codes.length) {
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
    } catch (e) {
      console.error(e);
      toast("カメラの起動に失敗しました", "error");
    }
  });

  registerBtn.addEventListener("click", async () => {
    const role = sessionStorage.getItem("responsibilityRole") || "user";
    const product = {
      mgtNo: $("#mgtNo").value.trim(),
      mgtDistNo: $("#mgtDistNo").value.trim(),
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
      createdBy: sessionStorage.getItem("responsibility
