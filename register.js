window.onload = function () {
  const name = sessionStorage.getItem("userName");
  const role = sessionStorage.getItem("userRole");
  const roleMap = { admin: "管理者", manager: "責任者", user: "一般ユーザー" };
  const roleJp = roleMap[role] || role;

  document.getElementById("userInfo").textContent = `${name}（${roleJp}）としてログイン中`;
  updateTime();
  setInterval(updateTime, 1000);
};

function updateTime() {
  const now = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const formatted = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}） ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  document.getElementById("currentTime").textContent = `現在日時：${formatted}`;
}
function registerProduct() {
  const name = document.getElementById("name").value.trim();
  const jan = document.getElementById("jan").value.trim();
  const location = document.getElementById("location").value.trim();
  const quantity = parseInt(document.getElementById("quantity").value);
  const limit = document.getElementById("limit").value;

  if (!name || !jan || !location) {
    alert("商品名・JANコード・保管場所は必須です");
    return;
  }

  if (!limit && !confirm("期限が未入力です。登録しますか？")) return;

  const data = {
    name,
    jan,
    location,
    quantity,
    limit: limit || null,
    timestamp: new Date().toISOString(),
    createdBy: sessionStorage.getItem("userName")
  };

  db.collection("products").add(data)
    .then(() => alert("登録完了"))
    .catch(err => alert("登録失敗：" + err));
}
function onBarcodeScan(janCode) {
  document.getElementById("jan").value = janCode;
  fetchProductInfo(janCode); // JANコードから商品名などを補完（任意）
}
