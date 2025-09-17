// ✅ Firebase初期化（重複防止）
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
    authDomain: "inventory-app-312ca.firebaseapp.com",
    projectId: "inventory-app-312ca",
    storageBucket: "inventory-app-312ca.appspot.com",
    messagingSenderId: "245219344089",
    appId: "1:245219344089:web:e46105927c302e6a5788c8"
  };
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ✅ 読み取り儀式（バーコード・QR）
let qrReaderInstance = null;

function startScan(targetId) {
  const overlay = document.getElementById("qrOverlay");
  overlay.style.display = "flex";

  if (!qrReaderInstance) {
    qrReaderInstance = new Html5Qrcode("qr-reader");
  }

  qrReaderInstance.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById(targetId).value = decodedText;
      stopScan();
    },
    (errorMessage) => {
      console.warn("読み取り失敗:", errorMessage);
    }
  );
}

function stopScan() {
  if (qrReaderInstance) {
    qrReaderInstance.stop().then(() => {
      document.getElementById("qrOverlay").style.display = "none";
    }).catch((err) => {
      console.error("停止失敗:", err);
      document.getElementById("qrOverlay").style.display = "none";
    });
  }
}

function closeQR() {
  stopScan();
}

function scanJAN() {
  startScan("janInput");
}
function scanCategory() {
  startScan("categoryLarge");
}
function scanLocation() {
  startScan("location");
}

// ✅ 管理番号自動生成
function generateAdminCode(jan, lot) {
  return `${jan}-${lot}`;
}

function generateControlId(adminCode, count) {
  return `${adminCode}-${count + 1}`;
}

async function getExistingCount(adminCode) {
  const snapshot = await db.collection("items").where("adminCode", "==", adminCode).get();
  return snapshot.size;
}

async function applyAutoGenerate() {
  const jan = document.querySelector("[name='jan']").value.trim();
  const lot = document.querySelector("[name='lot']").value.trim();
  if (!jan || !lot) {
    alert("JANコードとLot番号は必須です。");
    return;
  }
  const adminCode = generateAdminCode(jan, lot);
  const count = await getExistingCount(adminCode);
  const controlId = generateControlId(adminCode, count);

  document.querySelector("[name='adminCode']").value = adminCode;
  document.querySelector("[name='controlId']").value = controlId;

  alert("自動生成が適用されました");
}

// ✅ 商品登録処理（保留 → 管理者承認待ち）
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const data = {
      jan: form.jan.value.trim(),
      lot: form.lot.value.trim(),
      adminCode: form.adminCode.value.trim(),
      controlId: form.controlId.value.trim(),
      name: form.name.value.trim(),
      quantity: parseInt(form.quantity.value),
      unit: form.unit.value,
      expiry: form.expiry.value,
      maker: form.maker.value.trim(),
      location: form.location.value.trim(),
      categoryLarge: form.categoryLarge.value.trim(),
      categorySmall: form.categorySmall.value.trim(),
      photo: null, // 写真は別途アップロード処理が必要
      status: "保留",
      createdBy: auth.currentUser?.uid || "unknown",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection("items").add(data);
      await db.collection("history").add({
        type: "登録",
        actor: data.createdBy,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        targetItem: data.controlId,
        details: { status: "保留", name: data.name }
      });

      alert("登録完了：保留中です。管理者の承認を待っています。");
      form.reset();
      form.adminCode.value = "";
      form.controlId.value = "";
    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録に失敗しました。もう一度お試しください。");
    }
  });

  // ✅ 管理者表示制御
  const responsibleUser = document.getElementById("responsibleUser");
  const adminOnlyField = document.getElementById("adminOnlyField");

  auth.onAuthStateChanged(async (user) => {
    if (user && responsibleUser && adminOnlyField) {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const name = userData?.name || "不明";
        const role = userData?.role || "未設定";

        responsibleUser.textContent = `👑 ${name}（${role}）`;
        adminOnlyField.style.display = role === "管理者" ? "block" : "none";
      } catch (err) {
        console.error("ユーザー情報取得失敗:", err);
        responsibleUser.textContent = "👑 ログイン中：取得失敗";
        adminOnlyField.style.display = "none";
      }
    }
  });
});