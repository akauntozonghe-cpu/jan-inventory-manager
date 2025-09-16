import { db } from "./firebase.js";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

function generateAdminCode(jan, lot) {
  return `${jan}-${lot}`;
}

function generateControlId(adminCode, count) {
  return `${adminCode}-${count + 1}`;
}

async function getExistingCount(adminCode) {
  const q = query(collection(db, "items"), where("adminCode", "==", adminCode));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

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
    timestamp: serverTimestamp()
  };

  await addDoc(collection(db, "items"), data);
  alert("登録完了：痕跡が記録されました");
});

// 管理者表示制御（仮）
const isAdmin = true;
if (isAdmin) {
  document.getElementById("adminOnlyField").style.display = "block";
}