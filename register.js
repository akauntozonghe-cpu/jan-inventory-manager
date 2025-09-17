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

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const jan = form.jan.value.trim();
  const lot = form.lot.value.trim();
  const auto = document.getElementById("autoGenerate").checked;

  let adminCode = form.adminCode.value;
  let controlId = form.controlId.value;

  if (auto) {
    adminCode = generateAdminCode(jan, lot);
    const count = await getExistingCount(adminCode);
    controlId = generateControlId(adminCode, count);
    form.adminCode.value = adminCode;
    form.controlId.value = controlId;
  }

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

// 管理者表示制御
const isAdmin = true;
if (isAdmin) {
  document.getElementById("adminOnlyField").style.display = "block";
}

// QR読み取り（仮：実装はライブラリ連携）
function scanJAN() {
  alert("JANコード読み取り機能は未実装です（QRライブラリと連携可能）");
}
function scanCategory() {
  alert("大分類のQR読み取り機能は未実装です");
}
function scanLocation() {
  alert("保管場所のQR読み取り機能は未実装です");
}