function initHome() {
  const stats = $("#summaryStats");
  const expiring = $("#expiringList");
  const trending = $("#trendingList");

  if (!stats || !expiring || !trending) {
    console.warn("HOMEセクションの要素が見つかりません");
    return;
  }

  const total = allProducts.length;
  const expired = allProducts.filter(p => {
    const today = new Date().toISOString().slice(0, 10);
    return p.expire && p.expire < today;
  }).length;

  stats.innerHTML = `
    <h3>在庫サマリー</h3>
    <p>登録商品数：${total} 件</p>
    <p>期限切れ商品：${expired} 件</p>
  `;

  const soon = allProducts.filter(p => {
    if (!p.expire) return false;
    const today = new Date();
    const exp = new Date(p.expire);
    const diff = (exp - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  expiring.innerHTML = soon.length
    ? soon.map(p => `<li>${p.productName}（期限: ${p.expire}）</li>`).join("")
    : "<li>該当なし</li>";

  const freq = {};
  allProducts.forEach(p => {
    freq[p.productName] = (freq[p.productName] || 0) + 1;
  });

  const topItems = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  trending.innerHTML = topItems.length
    ? topItems.map(([name, count]) => `<li>${name}（${count}件）</li>`).join("")
    : "<li>該当なし</li>";
}

// ← ここで initHome() 関数が終了

}); // ← ここで DOMContentLoaded のイベントリスナーが終了
