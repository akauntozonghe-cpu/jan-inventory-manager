// Firebase 初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  // ✅ ログイン処理
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const number = document.getElementById("numberInput").value.trim();
      const errorMsg = document.getElementById("errorMsg");
      const loadingMsg = document.getElementById("loadingMsg");
      errorMsg.textContent = "";
      loadingMsg.textContent = "ログイン中...";

      try {
        const q = query(collection(db, "users"), where("number", "==", number));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const data = snap.docs[0].data();
          const name = data.name;
          const role = data.role === "admin" ? "管理者" : "責任者";

          sessionStorage.setItem("responsibilityNumber", number);
          sessionStorage.setItem("responsibilityName", name);
          sessionStorage.setItem("responsibilityRole", role);

          await addDoc(collection(db, "logs"), {
            userId: number,
            userName: name,
            role: role,
            action: "ログインしました",
            target: "ログイン画面",
            timestamp: serverTimestamp()
          });

          window.location.href = "user.html";
        } else {
          errorMsg.textContent = "番号が見つかりません";
        }
      } catch (err) {
        errorMsg.textContent = "エラーが発生しました";
        console.error(err);
      } finally {
        loadingMsg.textContent = "";
      }
    });
  }

  // ✅ セクション排他表示
  function toggleSection(id) {
    const allSections = document.querySelectorAll(".section");
    allSections.forEach(section => {
      if (section.id !== id) {
        section.classList.remove("show");
        sessionStorage.setItem("section_" + section.id, false);
      }
    });

    const el = document.getElementById(id);
    if (!el) return;
    const isVisible = el.classList.contains("show");
    el.classList.toggle("show", !isVisible);
    sessionStorage.setItem("section_" + id, !isVisible);

    document.querySelectorAll(".button-grid button").forEach(btn => btn.classList.remove("active"));
    if (!isVisible) {
      const btnMap = {
        registerSection: "btn-register",
        searchSection: "btn-search",
        contactSection: "btn-contact",
        historySection: "btn-history",
        listSection: "btn-list"
      };
      const activeBtn = document.getElementById(btnMap[id]);
      if (activeBtn) activeBtn.classList.add("active");
    }
  }

  // ✅ ボタンイベント設定
  const sectionButtons = {
    "btn-register": "registerSection",
    "btn-search": "searchSection",
    "btn-contact": "contactSection",
    "btn-history": "historySection",
    "btn-list": "listSection"
  };

  Object.entries(sectionButtons).forEach(([btnId, sectionId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", () => toggleSection(sectionId));
    }
  });

  // ✅ 商品検索用カメラ読み取り
  const scanSearchBtn = document.getElementById("scanSearchBtn");
  const scannerWrapper = document.getElementById("scannerWrapper");
  const scanStatus = document.getElementById("scanStatus");
  const searchInput = document.getElementById("searchInput");

  if (scanSearchBtn && scannerWrapper && scanStatus && searchInput) {
    scanSearchBtn.onclick = () => {
      toggleSection("searchSection"); // ✅ 排他表示を先に実行
      scannerWrapper.style.display = "block";
      scanStatus.textContent = "📷 読み取り中...";
      scanStatus.classList.add("show");

      if (window.Quagga) Quagga.stop(); // ✅ 前回セッションを終了

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#scanner"),
          constraints: {
            facingMode: "environment"
          }
        },
        decoder: { readers: ["ean_reader"] }
      }, err => {
        if (err) return console.error("カメラ初期化エラー:", err);
        Quagga.start();
      });

      Quagga.onDetected(data => {
        const code = data.codeResult.code;
        searchInput.value = code;

        scanStatus.textContent = `✅ 読み取り成功: ${code}`;
        scanStatus.classList.add("show");

        setTimeout(() => {
          scanStatus.classList.remove("show");
          scannerWrapper.style.display = "none";
          Quagga.stop();
        }, 1500);

        document.getElementById("searchBtn").click();
      });
    };
  }

  // ✅ 商品登録用カメラ読み取り
  const scanRegisterBtn = document.getElementById("startScanBtn");
  const scannerWrapperRegister = document.getElementById("scannerWrapperRegister");
  const scanStatusRegister = document.getElementById("scanStatusRegister");
  const janCodeInput = document.getElementById("janCodeInput");

  if (scanRegisterBtn && scannerWrapperRegister && scanStatusRegister && janCodeInput) {
    scanRegisterBtn.onclick = () => {
      toggleSection("registerSection"); // ✅ 排他表示を先に実行
      scannerWrapperRegister.style.display = "block";
      scanStatusRegister.textContent = "📷 読み取り中...";
      scanStatusRegister.classList.add("show");

      if (window.Quagga) Quagga.stop(); // ✅ 前回セッションを終了

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#scannerRegister"),
          constraints: {
            facingMode: "environment"
          }
        },
        decoder: { readers: ["ean_reader"] }
      }, err => {
        if (err) return console.error("カメラ初期化エラー:", err);
        Quagga.start();
      });

      Quagga.onDetected(data => {
        const code = data.codeResult.code;
        janCodeInput.value = code;

        scanStatusRegister.textContent = `✅ 読み取り成功: ${code}`;
        scanStatusRegister.classList.add("show");

        setTimeout(() => {
          scanStatusRegister.classList.remove("show");
          scannerWrapperRegister.style.display = "none";
          Quagga.stop();
        }, 1500);
      });
    };
  }
});
