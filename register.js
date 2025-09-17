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
  const adminCode = generateAdminCode(jan, lot);
  const count = await getExistingCount(adminCode);
  const controlId = generateControlId(adminCode, count);

  document.querySelector("[name='adminCode']").value = adminCode;
  document.querySelector("[name='controlId']").value = controlId;

  alert("自動生成が適用されました");
}

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

  await db.collection("items").add(data);
  alert("登録完了：痕跡が記録されました");
});

// 管理者表示制御
const isAdmin = true;
if (isAdmin) {
  document.getElementById("adminOnlyField").style.display = "block";
}

// 読み取りボタン（仮）
function scanJAN() {
  alert("JANコード読み取り機能は準備中です。手入力も可能です。");
}
function scanCategory() {
  alert("大分類のQR読み取り機能は準備中です。手入力をご利用ください。");
}
function scanLocation() {
  alert("保管場所のQR読み取り機能は準備中です。手入力をご利用ください。");
}

function toggleMenu() {
  alert("メニュー機能は準備中です。");
}
function goToPage(page) {
  alert(`「${page}」ページに移動します（仮）`);
}