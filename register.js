// ✅ Firebase初期化（重複防止）
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
    authDomain: "inventory-app-312ca.firebaseapp.com",
    projectId: "inventory-app-312ca",
    storageBucket: "inventory-app-312ca.appspot.com",
    messagingSenderId: "245219344089",
    appId: "1:245219344089:web:e46105927c302e6a5788c8"
  };
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ✅ 管理番号生成ロジック
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
  const msgBox = document.getElementById("registerMessage");
  const jan = document.getElementById("janInput").value.trim();
  const lot = document.getElementById("lotInput").value.trim();

  if (!jan || !lot) {
    msgBox.textContent = "⚠️ JANコードとLot番号は必須です。";
    msgBox.style.color = "red";
    return;
  }

  const adminCode = generateAdminCode(jan, lot);
  const count = await getExistingCount(adminCode);
  const controlId = generateControlId(adminCode, count);

  document.getElementById("adminCode").value = adminCode;
  document.getElementById("controlId").value = controlId;

  msgBox.textContent = "✅ 管理番号を自動生成しました";
  msgBox.style.color = "green";
}

// ✅ DOM構築後の処理
document.addEventListener("DOMContentLoaded", () => {
  const msgBox = document.getElementById("registerMessage");

  // 管理番号自動生成ボタン
  const autoBtn = document.getElementById("autoGenerateBtn");
  if (autoBtn) {
    autoBtn.addEventListener("click", applyAutoGenerate);
  }

  // 管理者専用：項目追加UI
  const addFieldBtn = document.getElementById("addFieldBtn");
  const extraFields = document.getElementById("extraFields");
  if (addFieldBtn && extraFields) {
    addFieldBtn.addEventListener("click", () => {
      const wrapper = document.createElement("div");
      wrapper.className = "extraField";
      wrapper.innerHTML = `
        <input type="text" class="extraKey" placeholder="フィールド名" />
        <input type="text" class="extraValue" placeholder="値" />
        <button type="button" class="delBtn">削除</button>
      `;
      wrapper.querySelector(".delBtn").onclick = () => wrapper.remove();
      extraFields.appendChild(wrapper);
    });
  }

  // 商品登録処理
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const user = auth.currentUser;
    if (!user) {
      msgBox.textContent = "⚠️ ログインが必要です";
      msgBox.style.color = "red";
      return;
    }

    // ✅ ヘッダーで取得済みのユーザー情報を利用
    const role = window.currentUserInfo?.role || "未設定";
    const name = window.currentUserInfo?.name || "不明";
    const isAdmin = role === "管理者";

    // 管理番号が未入力なら自動生成
    let adminCode = form.adminCode.value.trim();
    let controlId = form.controlId.value.trim();
    if (!adminCode || !controlId) {
      const jan = form.jan.value.trim();
      const lot = form.lot.value.trim();
      adminCode = generateAdminCode(jan, lot);
      const count = await getExistingCount(adminCode);
      controlId = generateControlId(adminCode, count);
    }

    // 基本データ
    const data = {
      jan: form.jan.value.trim(),
      lot: form.lot.value.trim(),
      adminCode,
      controlId,
      name: form.name.value.trim(),
      quantity: parseInt(form.quantity.value),
      unit: form.unit.value,
      expiry: form.expiry.value,
      maker: form.maker.value.trim(),
      location: form.location.value.trim(),
      categoryLarge: form.categoryLarge.value.trim(),
      categorySmall: form.categorySmall.value.trim(),
      photo: null,
      status: isAdmin ? "承認済" : "保留",
      createdBy: user.uid,
      createdByName: name,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 管理者なら追加項目も収集
    if (isAdmin && extraFields) {
      extraFields.querySelectorAll(".extraField").forEach(f => {
        const key = f.querySelector(".extraKey").value.trim();
        const val = f.querySelector(".extraValue").value.trim();
        if (key) data[key] = val;
      });
    }

    try {
      if (isAdmin) {
        // 管理者は items に即登録
        const itemRef = await db.collection("items").add(data);
        await db.collection("history").add({
          type: "登録（即承認）",
          actor: user.uid,
          targetItem: itemRef.id,
          controlId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          details: { status: data.status, name: data.name }
        });
        msgBox.textContent = "✅ 登録完了（即一覧反映）";
        msgBox.style.color = "green";
      } else {
        // 責任者以下は pendingItems に保存
        const pendingRef = await db.collection("pendingItems").add(data);
        await db.collection("history").add({
          type: "登録（保留）",
          actor: user.uid,
          targetItem: pendingRef.id,
          controlId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          details: { status: data.status, name: data.name }
        });
        await db.collection("notificationLogs").add({
          title: "承認依頼",
          body: `${name} さんが ${data.name} を登録しました`,
          type: "approval",
          target: "admin",
          pendingId: pendingRef.id,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        msgBox.textContent = "✅ 登録完了（承認待ち・管理者に通知）";
        msgBox.style.color = "orange";
      }

      form.reset();
      document.getElementById("adminCode").value = "";
      document.getElementById("controlId").value = "";
      document.getElementById("photoPreview").style.display = "none";
      if (extraFields) extraFields.innerHTML = "";
    } catch (error) {
      console.error("登録エラー:", error);
      msgBox.textContent = "❌ 登録に失敗しました。もう一度お試しください。";
      msgBox.style.color = "red";
    }
  });

  // 写真プレビュー
  const photoInput = document.getElementById("photoInput");
  const photoPreview = document.getElementById("photoPreview");
  if (photoInput && photoPreview) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          photoPreview.src = reader.result;
          photoPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        photoPreview.src = "";
        photoPreview.style.display = "none";
      }
    });
  }

    // 管理者表示制御（ヘッダーの情報を利用）
  const responsibleUser = document.getElementById("responsibleUser");
  const adminOnlyField = document.getElementById("adminOnlyField");

  auth.onAuthStateChanged((user) => {
    if (user && adminOnlyField) {
      const role = window.currentUserInfo?.role || "未設定";
      const name = window.currentUserInfo?.name || "不明";

      console.log("ログインユーザー:", name, "role:", role);

      if (responsibleUser) {
        responsibleUser.textContent = `👑 ${name}（${role}）`;
      }
      adminOnlyField.style.display = role === "管理者" ? "block" : "none";
    } else if (adminOnlyField) {
      adminOnlyField.style.display = "none";
    }
  });
});