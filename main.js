import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  let allProducts = [];

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

      toast("ログイン成功", "success");
      setTimeout(() => showApp(), 500);
    } catch (e) {
      console.error("ログイン失敗:", e);
      toast("ログイン処理に失敗しました", "error");
    }
  });

  async function showApp() {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    await initList();
    initHeader();
    initMenu();
    initHome();
    routeTo("homeSection");
  }

  async function initList() {
    try {
      const snap = await getDocs(collection(db, "products"));
      allProducts = snap.docs.map(doc => doc.data());
    } catch (e) {
      console.error("商品一覧の取得に失敗しました", e);
      toast("商品一覧の取得に失敗しました", "error");
    }
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

    $("#systemTitle")?.addEventListener("click", () => {
      routeTo("homeSection");
      $("#sideMenu")?.classList.remove("open");
    });

    $$(".nav-item[data-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        routeTo(btn.dataset.target);
        $("#sideMenu")?.classList.remove("open");
      });
    });

    document.addEventListener("click", (e) => {
      const menu = $("#sideMenu");
      const hamburger = $("#hamburgerMenu");
      if (!menu?.classList.contains("open")) return;
      const clickedInsideMenu = menu.contains(e.target);
      const clickedHamburger = hamburger?.contains(e.target);
      if (!clickedInsideMenu && !clickedHamburger) {
        menu.classList.remove("open");
      }
    });
  }

  function routeTo(panelId) {
    $$(".panel").forEach((p) => p.classList.add("hidden"));
    const el = $(`#${panelId}`);
    if (el) {
      el.classList.remove("hidden");
      el.classList.remove("fade");
      void el.offsetWidth;
      el.classList.add("fade");
    }
  }

  function initHome() {
    console.log("initHome 実行");
    const stats = $("#summaryStats");
    const expiring = $("#expiringList");
    const trending = $("#trendingList");

    if (!stats || !expiring || !trending) {
      console.warn("HOMEセクションの要素が見つかりません");
      return;
    }

    const total = allProducts.length;
    const expired = allProducts.filter(p => {
      const today = new Date().toISOString().slice(0, 10);
      return p.expire && p.expire < today;
    }).length;

    stats.innerHTML = `
      <h3>在庫サマリー</h3>
      <p>登録商品数：${total} 件</p>
      <p>期限切れ商品：${expired} 件</p>
    `;

    const soon = allProducts.filter(p => {
      if (!p.expire) return false;
      const today = new Date();
      const exp = new Date(p.expire);
      const diff = (exp - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    expiring.innerHTML = soon.length
      ? soon.map(p => `<li>${p.productName}（期限: ${p.expire}）</li>`).join("")
      : "<li>該当なし</li>";

    const freq = {};
    allProducts.forEach(p => {
      freq[p.productName] = (freq[p.productName] || 0) + 1;
    });

    const topItems = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    trending.innerHTML = topItems.length
      ? topItems.map(([name, count]) => `<li>${name}（${count}件）</li>`).join("")
      : "<li>該当なし</li>";
  }
});

