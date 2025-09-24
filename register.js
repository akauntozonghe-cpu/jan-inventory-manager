// === DOM構築後の処理 ===
document.addEventListener("DOMContentLoaded", async () => {
  const msgBox = document.getElementById("registerMessage");

  // schema 読み込みとフォーム描画（管理者かどうかは後で判定）
  const schema = await loadSchema();
  renderForm(schema, "dynamicFormContainer", false);

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

    // 最新の role / name を取得
    const role = window.currentUserInfo?.role || "未設定";
    const name = window.currentUserInfo?.name || user.displayName || "不明";

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
      const role = window.currentUserInfo?.role || "未設定";
      const name = window.currentUserInfo?.name || user.displayName || "不明";

      if (responsibleUser) {
        responsibleUser.textContent = `👑 ${name}（${role}）`;
      }
      if (adminTools) {
        adminTools.style.display = role === "管理者" ? "block" : "none";
      }

      // 管理者ならフォーム再描画（adminOnly項目を表示）
      renderForm(schema, "dynamicFormContainer", role === "管理者");

    } else {
      if (responsibleUser) {
        responsibleUser.textContent = "⚠️ ログインしていません";
      }
      if (adminTools) adminTools.style.display = "none";
    }
  });
});