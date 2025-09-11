// utils.js

export function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

export function updateTime(el) {
  const now = new Date();
  el.textContent = now.toLocaleString("ja-JP");
}

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { db } from "./main.js"; // または firebase-config.js に分離している場合はそちらから

export async function generateManagementNumber(key) {
  const q = collection(db, "products");
  const snapshot = await getDocs(q);
  let count = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.managementKey === key) count++;
  });
  return `${key}-${count + 1}`;
}
