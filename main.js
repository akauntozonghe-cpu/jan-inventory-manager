import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
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

document.addEventListener("DOMContentLoaded", () => {
  const loginView = $("#loginView");
  const appView = $("#appView");
  const loginInput = $("#responsibilityId");
  const loginBtn = $("#loginBtn");

  loginInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn?.click();
  });

  loginBtn?.addEventListener("click", async () => {
    const id = loginInput.value.trim();
    if (!id) {
      loginInput.classList.add("is-invalid");
      setTimeout(() => loginInput.classList.remove("is-invalid"), 800);
      toast("責任者番号を入力してください", "error");
      return;
    }

    try {
      const qy = query(collection(db, "users"), where("id", "==", id));
      const snap = await getDocs(qy);
      if (snap.empty) {
        toast("番号が見つかりません", "error");
        return;
      }

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
  });

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
      initHome();
      routeTo("homeSection");
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
    $("#hamburgerMenu")?.addEventListener("click", () => {
      $("#sideMenu")?.classList.toggle("open");
    });

    $$(".nav-item[data-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        routeTo(btn.dataset.target);
        $("#sideMenu")?.classList.remove("open");
      });
    });

    $("#logoutBtn")?.addEventListener("click", async () => {
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

  function initProductForm() {
    const registerBtn = $("#registerBtn");
    const photoInput = $("#photo");

    registerBtn?.addEventListener("click", async () => {
      const role = sessionStorage.getItem("responsibilityRole") || "user";
      const product = {
        mgtNo: $("#mgtNo")?.value.trim(),
        mgtDistNo: role === "admin" ? $("#mgtDistNo")?.value.trim() : "",
        location: $("#location")?.value.trim(),
        catL: $("#catL")?.value.trim(),
        catS: $("#catS")?.value.trim(),
        jan: $("#jan")?.value.trim(),
        company: $("#company")?.value.trim(),
        productName: $("#productName")?.value.trim(),
        lotNo: $("#lotNo")?.value.trim(),
        expire: $("#expire")?.value ? new Date($("#expire").value).toISOString().slice(0, 10) : "",
        qty: Number($("#qty")?.value || 0),
        qtyUnit: $("#qtyUnit")?.value,
        photoUrl: "",
        createdBy: sessionStorage.getItem("responsibilityName"),
        createdAt: new Date()
      };

      if (!product.mgtNo || !product.productName) {
        ["#mgtNo", "#productName"].forEach((s) => {
          const el = $(s);
          if (el && !el.value.trim()) {
            el.classList.add("is-invalid");
            setTimeout(() => el.classList.remove("is-invalid"), 800);
          }
        });
        toast("管理番号と品名は必須です", "error");
        return;
      }

      const file = photoInput?.files?.[0];
      if (file) {
        try {
          const key = `products/${product.mgtNo}/${Date.now()}_${file.name}`;
          const r = sRef(storage, key);
          await uploadBytes(r, file);
          product.photoUrl = await getDownloadURL(r);
        } catch (e) {
          console.warn("画像アップロード失敗", e);
          toast("画像のアップロードに失敗しました", "error");
        }
      }

      try {
        await setDoc(doc(db, "products", product.mgtNo), product);
        toast("商品を登録しました", "success");
        await logAction("商品登録", {
          mgtNo: product.mgtNo,
          jan: product.jan,
          qty: product.qty,
          unit: product.qtyUnit
        });
        clearProductForm();
        await loadProducts();
        routeTo("listSection");
      } catch (e) {
        console.error(e);
        toast("商品の登録に失敗しました", "error");
      }
    });
  }

  function clearProductForm() {
  [
    "#mgtNo", "#mgtDistNo", "#location", "#catL", "#catS",
    "#jan", "#company", "#productName", "#lotNo", "#expire", "#qty", "#photo"
  ].forEach((selector) => {
    const el = document.querySelector(selector);
    if (el) el.value = "";
  });
  const unit = document.querySelector("#qtyUnit");
  if (unit) unit.value = "個";
}
});
