const role = sessionStorage.getItem("responsibilityRole");
const isAdmin = role === "管理者";

if (isAdmin) {
  // ✅ ユーザー管理
  const addUserBtn = document.getElementById("addUserBtn");
  const deleteUserBtn = document.getElementById("deleteUserBtn");

  if (addUserBtn) {
    addUserBtn.onclick = async () => {
      const name = document.getElementById("newUserName").value.trim();
      const number = document.getElementById("newUserNumber").value.trim();
      const role = document.getElementById("newUserRole").value;
      if (!name || !number) return alert("名前と番号を入力してください");
      await addDoc(collection(db, "users"), { name, number, role });
      alert("ユーザーを追加しました");
    };
  }

  if (deleteUserBtn) {
    deleteUserBtn.onclick = async () => {
      const number = document.getElementById("deleteUserNumber").value.trim();
      if (!number || !confirm("本当に削除しますか？")) return;
      const q = query(collection(db, "users"), where("number", "==", number));
      const snap = await getDocs(q);
      snap.forEach(doc => deleteDoc(doc.ref));
      alert("削除しました");
    };
  }

  // ✅ ログ閲覧・CSV出力
  const loadLogsBtn = document.getElementById("loadLogsBtn");
  const exportLogsBtn = document.getElementById("exportLogsBtn");

  if (loadLogsBtn) {
    loadLogsBtn.onclick = async () => {
      const date = document.getElementById("logDateFilter").value;
      const user = document.getElementById("logUserFilter").value.trim();
      const snap = await getDocs(collection(db, "logs"));
      const filtered = snap.docs.filter(doc => {
        const d = doc.data();
        const matchDate = date ? d.timestamp?.toDate().toISOString().startsWith(date) : true;
        const matchUser = user ? d.userName.includes(user) : true;
        return matchDate && matchUser;
      });
      document.getElementById("logList").innerHTML = filtered.map(doc => {
        const d = doc.data();
        return `<div>${d.timestamp?.toDate().toLocaleString()} - ${d.userName} (${d.role}) - ${d.action}</div>`;
      }).join("");
    };
  }

  if (exportLogsBtn) {
    exportLogsBtn.onclick = async () => {
      const snap = await getDocs(collection(db, "logs"));
      const rows = [["日時", "ユーザー", "ロール", "操作"]];
      snap.forEach(doc => {
        const d = doc.data();
        rows.push([
          d.timestamp?.toDate().toLocaleString(),
          d.userName,
          d.role,
          d.action
        ]);
      });
      const csv = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  // ✅ 商品データ管理
  let productOffset = 0;
  const productLimit = 10;
  let allProducts = [];

  const loadProductsBtn = document.getElementById("loadProductsBtn");
  const loadMoreProductsBtn = document.getElementById("loadMoreProductsBtn");
  const exportProductsBtn = document.getElementById("exportProductsBtn");
  const filterProductsBtn = document.getElementById("filterProductsBtn");
  const sortProducts = document.getElementById("sortProducts");

  if (loadProductsBtn) {
    loadProductsBtn.onclick = async () => {
      const snap = await getDocs(collection(db, "products"));
      allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      productOffset = 0;
      renderProducts();
    };
  }

  if (loadMoreProductsBtn) {
    loadMoreProductsBtn.onclick = () => {
      productOffset += productLimit;
      renderProducts();
    };
  }

  if (filterProductsBtn) {
    filterProductsBtn.onclick = () => {
      const keyword = document.getElementById("productFilter").value.trim();
      const filtered = allProducts.filter(p =>
        p.productName.includes(keyword) || p.janCode.includes(keyword)
      );
      renderProducts(filtered);
    };
  }

  if (sortProducts) {
    sortProducts.onchange = () => {
      const val = sortProducts.value;
      const sorted = [...allProducts];
      if (val === "nameAsc") sorted.sort((a, b) => a.productName.localeCompare(b.productName));
      if (val === "nameDesc") sorted.sort((a, b) => b.productName.localeCompare(a.productName));
      if (val === "janAsc") sorted.sort((a, b) => a.janCode.localeCompare(b.janCode));
      renderProducts(sorted.slice(0, productOffset + productLimit));
    };
  }

  if (exportProductsBtn) {
    exportProductsBtn.onclick = () => {
      const rows = [["商品名", "JANコード", "会社名", "Lot番号", "単位"]];
      allProducts.forEach(p => {
        rows.push([p.productName, p.janCode, p.company, p.lotNumber, p.unit]);
      });
      const csv = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  window.updateProduct = async (id) => {
    const item = document.querySelector(`[data-id="${id}"]`).parentElement;
    const updated = {
      productName: item.querySelector(".edit-name").value.trim(),
      janCode: item.querySelector(".edit-jan").value.trim(),
      company: item.querySelector(".edit-company").value.trim(),
      lotNumber: item.querySelector(".edit-lot").value.trim(),
      unit: item.querySelector(".edit-unit").value.trim(),
      timestamp: serverTimestamp()
    };
    await setDoc(doc(db, "products", id), updated);
    alert("更新しました");
  };

  window.deleteProduct = async (id) => {
    if (!confirm("本当に削除しますか？")) return;
    await deleteDoc(doc(db, "products", id));
    alert("削除しました");
    allProducts = allProducts.filter(p => p.id !== id);
    renderProducts();
  };

  function renderProducts(list = allProducts.slice(0, productOffset + productLimit)) {
    const container = document.getElementById("productList");
    container.innerHTML = list.map(p => `
      <div class="product-item">
        <input value="${p.productName}" data-id="${p.id}" class="edit-name">
        <input value="${p.janCode}" class="edit-jan">
        <input value="${p.company}" class="edit-company">
        <input value="${p.lotNumber}" class="edit-lot">
        <input value="${p.unit}" class="edit-unit">
        <button onclick="updateProduct('${p.id}')">更新</button>
        <button onclick="deleteProduct('${p.id}')">削除</button>
      </div>
    `).join("");

    loadMoreProductsBtn.style.display =
      productOffset + productLimit < allProducts.length ? "block" : "none";
  }
}
