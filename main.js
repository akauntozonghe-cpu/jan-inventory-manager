      const product = {
        mgtNo: $("#mgtNo").value.trim(),
        mgtDistNo: role === "admin" ? $("#mgtDistNo").value.trim() : "",
        location: $("#location").value.trim(),
        catL: $("#catL").value.trim(),
        catS: $("#catS").value.trim(),
        jan: $("#jan").value.trim(),
        company: $("#company").value.trim(),
        productName: $("#productName").value.trim(),
        lotNo: $("#lotNo").value.trim(),
        expire: $("#expire").value ? new Date($("#expire").value).toISOString().slice(0, 10) : "",
        qty: Number($("#qty").value || 0),
        qtyUnit: $("#qtyUnit").value,
        photoUrl: "",
        createdBy: sessionStorage.getItem("responsibilityName"),
        createdAt: new Date()
      };

      if (!product.mgtNo || !product.productName) {
        ["#mgtNo", "#productName"].forEach((s) => {
          const el = $(s);
          if (el && !el.value.trim()) {
            el.classList.add("is-invalid");
            setTimeout(() => el.classList.remove("is-invalid"), 800);
          }
        });
        return toast("管理番号と品名は必須です", "error");
      }

      const file = photoInput.files?.[0];
      if (file) {
        try {
          const key = `products/${product.mgtNo}/${Date.now()}_${file.name}`;
          const r = sRef(storage, key);
          await uploadBytes(r, file);
          product.photoUrl = await getDownloadURL(r);
        } catch (e) {
          console.warn("画像アップロード失敗", e);
          toast("画像のアップロードに失敗しました（後で再試行可）", "error");
        }
      }

      try {
        await setDoc(doc(db, "products", product.mgtNo), product);
        toast("商品を登録しました", "success");
        await logAction("商品登録", {
          mgtNo: product.mgtNo,
          jan: product.jan,
          qty: product.qty,
          unit: product.qtyUnit
        });
        clearProductForm();
        await loadProducts();
        routeTo("listSection");
      } catch (e) {
        console.error(e);
        toast("商品の登録に失敗しました", "error");
      }
    });

    function clearProductForm() {
      [
        "#mgtNo", "#mgtDistNo", "#location", "#catL", "#catS",
        "#jan", "#company", "#productName", "#lotNo", "#expire", "#qty", "#photo"
      ].forEach((s) => {
        const el = $(s);
        if (!el) return;
        el.value = "";
      });
      $("#qtyUnit").value = "個";
    }
  }

  let allProducts = [];

  async function loadProducts() {
    const snap = await getDocs(collection(db, "products"));
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }

  function initList() {
    loadProducts(); // 初期読み込み
  }

  function initHome() {
    const stats = $("#summaryStats");
    const expiring = $("#expiringSoon");
    const trending = $("#trendingItems");
    const flea = $("#fleaTips");

    const total = allProducts.length;
    const byCategory = {};
    allProducts.forEach(p => {
      const cat = p.catL || "未分類";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    stats.innerHTML = `<h3>現在の在庫数</h3><p>登録商品数: ${total}</p>` +
      Object.entries(byCategory).map(([k,v]) => `<p>${k}: ${v}件</p>`).join("");

    const soon = allProducts
      .filter(p => p.expire)
      .sort((a,b) => new Date(a.expire) - new Date(b.expire))
      .slice(0,5);
    expiring.innerHTML = `<h3>期限が近い商品</h3>` +
      soon.map(p => `<p>${escapeHtml(p.productName)}（${p.expire}）</p>`).join("");

    const janCount = {};
    allProducts.forEach(p => {
      if (p.jan) janCount[p.jan] = (janCount[p.jan] || 0) + 1;
    });
    const trending = Object.entries(janCount)
      .sort((a,b) => b[1] - a[1])
      .slice(0,5);
    trendingItems.innerHTML = `<h3>注目JANコード</h3>` +
      trending.map(([jan,count]) => `<p>${jan}: ${count}件</p>`).join("");

    flea.innerHTML = `<h3>フリマ運営ヒント</h3><p>在庫が多い商品は出品候補に。期限が近いものは値引き対象に。</p>`;
  }

  $("#systemTitle").addEventListener("click", () => {
    routeTo("homeSection");
    initHome();
  });
});
