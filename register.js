// Firebase初期化
const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  databaseURL: "https://inventory-app-312ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventory-app-312ca",
  storageBucket: "inventory-app-312ca.appspot.com",
  messagingSenderId: "245219344089",
  appId: "1:245219344089:web:e46105927c302e6a5788c8",
  measurementId: "G-TRH31MJCE3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();


// ヘッダー初期化処理
function startHeaderLogic() {
  // 現在時刻の更新
  setInterval(() => {
    const now = new Date();
    const formatted = now.toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      weekday: "short"
    });
    document.getElementById("clock").textContent = `⏱ 現在：${formatted}`;
  }, 1000);

  // 最終判定の取得
  db.collection("loginLogs")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const log = snapshot.docs[0].data();
        const time = log.timestamp.toDate().toLocaleString("ja-JP", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          weekday: "short"
        });
        document.getElementById("lastJudgment").textContent = `🕒 最終判定：${time}`;
      }
    });

  // ログイン資格の表示と管理者判定
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const name = userData?.name || "不明";
        const role = userData?.role || "未設定";

        document.getElementById("responsibleUser").textContent = `👑 ${name}（${role}）`;

        if (role === "管理者") {
          document.getElementById("adminOnlyField").style.display = "block";
        } else {
          document.getElementById("adminOnlyField").style.display = "none";
        }
      } catch (err) {
        console.error("ユーザー情報取得失敗:", err);
        document.getElementById("responsibleUser").textContent = "👑 ログイン中：取得失敗";
        document.getElementById("adminOnlyField").style.display = "none";
      }
    } else {
      document.getElementById("responsibleUser").textContent = "👑 未ログイン";
      document.getElementById("adminOnlyField").style.display = "none";
    }
  });
}


// 管理番号生成ロジック
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
  const jan = document.getElementById("janInput").value.trim();
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


// 商品登録処理
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
    categoryLarge: form.categoryLarge.value.trim(),
    categorySmall: form.categorySmall.value.trim(),
    location: form.location.value.trim(),
    maker: form.maker.value.trim(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("items").add(data);
    alert("登録完了：痕跡が記録されました");
    form.reset();
    form.adminCode.value = "";
    form.controlId.value = "";
  } catch (error) {
    console.error("登録エラー:", error);
    alert("登録に失敗しました。もう一度お試しください。");
  }
});


// QR読み取り（html5-qrcode）
function startScan(targetId) {
  const readerId = "qr-reader";
  let readerDiv = document.getElementById(readerId);
  if (!readerDiv) {
    readerDiv = document.createElement("div");
    readerDiv.id = readerId;
    readerDiv.style.width = "300px";
    document.body.appendChild(readerDiv);
  }
  readerDiv.style.display = "block";

  const qrReader = new Html5Qrcode(readerId);
  qrReader.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById(targetId).value = decodedText;
      qrReader.stop();
      readerDiv.style.display = "none";
    },
    (errorMessage) => {
      console.warn("読み取り失敗:", errorMessage);
    }
  );
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


// メニュー操作（仮）
function toggleMenu() {
  alert("メニュー機能は準備中です。");
}
function goToPage(page) {
  alert(`「${page}」ページに移動します（仮）`);
}