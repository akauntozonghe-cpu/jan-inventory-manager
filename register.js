import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const storage = getStorage();

// === 管理番号生成ロジック ===
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

// === schema 読み込み ===
async function loadSchema() {
  const snap = await getDoc(doc(db, "config", "formSchema"));
  return snap.exists() ? snap.data().schema : [];
}

// === フォーム描画（schema部分のみ） ===
function renderForm(schema, containerId, isAdmin) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  schema.forEach(field => {
    if (field.adminOnly && !isAdmin) return;

    const wrapper = document.createElement("div");
    wrapper.className = "formField";

    const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", field.key);

    let input;
    switch (field.type) {
      case "file":
        input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        // プレビュー
        const preview = document.createElement("img");
        preview.id = field.key + "Preview";
        preview.style.display = "none";
        preview.style.maxWidth = "100%";
        input.onchange = e => {
          const file = e.target.files[0];
          if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
          }
        };
        wrapper.appendChild(preview);
        break;
      case "textarea":
        input = document.createElement("textarea");
        break;
      case "select":
        input = document.createElement("select");
        (field.options || []).forEach(opt => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
        break;
      default:
        input = document.createElement("input");
        input.type = field.type || "text";
    }

    input.name = field.key;
    input.id = field.key;
    if (field.required) input.required = true;

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    container.appendChild(wrapper);
  });
}

// === 写真アップロード処理 ===
async function handlePhotoUpload(file, controlId) {
  if (!file) return null;
  const storageRef = ref(storage, `photos/${controlId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// === 入力値収集 ===
function collectFormData(schema, form, user, role, adminCode, controlId, photoUrl, name) {
  const data = {
    // 固定フィールド
    jan: form.jan?.value.trim(),
    lot: form.lot?.value.trim(),
    adminCode,
    controlId,
    status: role === "管理者" ? "承認済" : "承認待ち",
    createdBy: user.uid,
    createdByName: name,
    updatedAt: serverTimestamp(),
    timestamp: serverTimestamp()
  };

  // 固定の写真フィールド
  if (photoUrl) {
    data.photo = photoUrl;
  }

  // schema フィールド
  schema.forEach(field => {
    const el = form.elements[field.key];
    if (!el) return;

    if (field.type === "file") {
      data[field.key] = photoUrl;
    } else {
      data[field.key] = el.value.trim();
    }
  });

  return data;
}

// === DOM構築後の処理 ===
document.addEventListener("DOMContentLoaded", async () => {
  const msgBox = document.getElementById("registerMessage");
  const role = window.currentUserInfo?.role || "未設定";
  const name = window.currentUserInfo?.name || "不明";
  const isAdmin = role === "管理者";

  // schema 読み込みとフォーム描画
  const schema = await loadSchema();
  renderForm(schema, "dynamicFormContainer", isAdmin);

  // === 商品登録処理 ===
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const user = auth.currentUser;
    if (!user) {
      msgBox.textContent = "⚠️ ログインが必要です";
      msgBox.style.color = "red";
      return;
    }

    // 固定フィールドから adminCode/controlId を生成
    let adminCode = form.adminCode ? form.adminCode.value.trim() : "";
    let controlId = form.controlId ? form.controlId.value.trim() : "";
    if (!adminCode || !controlId) {
      const jan = form.jan?.value.trim();
      const lot = form.lot?.value.trim();
      adminCode = generateAdminCode(jan, lot);
      const count = await getExistingCount(adminCode);
      controlId = generateControlId(adminCode, count);
    }

    // 写真アップロード（固定photo）
    const photoFile = form.photo?.files[0];
    let photoUrl = null;
    if (photoFile) {
      photoUrl = await handlePhotoUpload(photoFile, controlId);
    }

    // データ収集
    const data = collectFormData(schema, form, user, role, adminCode, controlId, photoUrl, name);

    try {
      if (role === "管理者") {
        await addDoc(collection(db, "items"), data);
        msgBox.textContent = "✅ 登録完了（即一覧に反映されました）";
        msgBox.style.color = "green";
      } else if (role === "責任者") {
        await addDoc(collection(db, "pendingItems"), data);
        msgBox.textContent = "✅ 登録完了（承認待ち：管理者に通知されます）";
        msgBox.style.color = "orange";
      } else {
        msgBox.textContent = "⚠️ 権限が不明のため登録できません";
        msgBox.style.color = "red";
      }

      form.reset();
      schema.forEach(field => {
        if (field.type === "file") {
          const preview = document.getElementById(field.key + "Preview");
          if (preview) {
            preview.style.display = "none";
            preview.src = "";
          }
        }
      });
      const photoPreview = document.getElementById("photoPreview");
      if (photoPreview) {
        photoPreview.style.display = "none";
        photoPreview.src = "";
      }
    } catch (error) {
      console.error("登録エラー:", error);
      msgBox.textContent = "❌ 登録に失敗しました。もう一度お試しください。";
      msgBox.style.color = "red";
    }
  });

  // === 管理者表示制御 ===
  const responsibleUser = document.getElementById("responsibleUser");
  const adminTools = document.getElementById("adminTools");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (responsibleUser) {
        responsibleUser.textContent = `👑 ${name}（${role}）`;
      }
      if (adminTools) {
        adminTools.style.display = role === "管理者" ? "block" : "none";
      }
    } else {
      if (adminTools) adminTools.style.display = "none";
    }
  });
});