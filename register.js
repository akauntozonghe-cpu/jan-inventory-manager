// Firebase 初期化
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

// 管理識別生成
function generateAdminCode(jan, lot) {
  return `${jan}-${lot}`;
}

function generateControlId(adminCode, count) {
  return `${adminCode}-${count + 1}`;
}

// 既存件数取得（区別番号生成のため）
async function getExistingCount(adminCode) {
  const snapshot = await db.collection("items").where("adminCode", "==", adminCode).get();
  return snapshot.size;
}

// 登録処理
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const jan = form.jan.value.trim();
  const lot = form.lot.value.trim();
  const adminCode = generateAdminCode(jan, lot);
  const count = await getExistingCount(adminCode);
  const controlId = generateControlId(adminCode, count);

  form.adminCode.value = adminCode;
  form.controlId.value = controlId;

  const data = {
    jan,
    lot,
    adminCode,
    controlId,
    name: form.name.value.trim(),
    quantity: parseInt(form.quantity.value),
    unit: form.unit.value,
    categoryLarge: form.categoryLarge.value.trim(),
    categorySmall: form.categorySmall.value.trim(),
    location: form.location.value.trim(),
    maker: form.maker.value.trim(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("items").add(data);
  alert("登録完了：痕跡が記録されました");
});

// 管理者表示制御（仮）
const isAdmin = true;
if (isAdmin) {
  document.getElementById("adminOnlyField").style.display = "block";
}