import { db } from "./firebase.js";
import { doc, getDoc, setDoc } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// === schema 読み込み ===
async function loadSchema() {
  const snap = await getDoc(doc(db, "config", "formSchema"));
  return snap.exists() ? snap.data().schema : [];
}

// === エディタ描画 ===
function renderEditor(schema) {
  const editor = document.getElementById("schemaEditor");
  editor.innerHTML = "";

  schema.forEach((field, index) => {
    const row = document.createElement("div");
    row.className = "schemaRow";
    row.draggable = true; // ドラッグ可能に

    row.innerHTML = `
      <input type="text" value="${field.key}" class="schemaKey" placeholder="キー" />
      <input type="text" value="${field.label}" class="schemaLabel" placeholder="ラベル" />
      <select class="schemaType">
        <option ${field.type==="text"?"selected":""}>text</option>
        <option ${field.type==="number"?"selected":""}>number</option>
        <option ${field.type==="date"?"selected":""}>date</option>
        <option ${field.type==="textarea"?"selected":""}>textarea</option>
        <option ${field.type==="file"?"selected":""}>file</option>
        <option ${field.type==="select"?"selected":""}>select</option>
      </select>
      <label>
        必須 <input type="checkbox" class="schemaRequired" ${field.required?"checked":""}/>
      </label>
      <input type="text" value="${(field.options||[]).join(",")}" 
             class="schemaOptions" placeholder="選択肢（カンマ区切り）"
             style="display:${field.type==="select"?"inline-block":"none"};" />
      <button type="button" class="delBtn">削除</button>
    `;
    editor.appendChild(row);

    // 削除ボタン
    row.querySelector(".delBtn").onclick = () => {
      schema.splice(index, 1);
      renderEditor(schema);
    };

    // type が select のときだけ options 入力欄を表示
    const typeSelect = row.querySelector(".schemaType");
    const optionsInput = row.querySelector(".schemaOptions");
    typeSelect.addEventListener("change", () => {
      if (typeSelect.value === "select") {
        optionsInput.style.display = "inline-block";
      } else {
        optionsInput.style.display = "none";
      }
    });

    // ドラッグイベント
    row.addEventListener("dragstart", () => {
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      // 並び替え後に schema を更新
      const newOrder = [];
      editor.querySelectorAll(".schemaRow").forEach(r => {
        newOrder.push(collectRowData(r));
      });
      schema.splice(0, schema.length, ...newOrder);
    });
  });

  // ドロップ位置制御
  editor.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = editor.querySelector(".dragging");
    const afterElement = getDragAfterElement(editor, e.clientY);
    if (afterElement == null) {
      editor.appendChild(dragging);
    } else {
      editor.insertBefore(dragging, afterElement);
    }
  });

  // 保存ボタン
  document.getElementById("saveSchemaBtn").onclick = async () => {
    const newSchema = [];
    editor.querySelectorAll(".schemaRow").forEach(row => {
      newSchema.push(collectRowData(row));
    });
    await setDoc(doc(db, "config", "formSchema"), { schema: newSchema });
    document.getElementById("editorMessage").textContent = "✅ 保存しました";
  };

  // プレビュー
  document.getElementById("previewBtn").onclick = () => {
    renderPreview(schema);
  };
}

// === 1行分のデータ収集 ===
function collectRowData(row) {
  return {
    key: row.querySelector(".schemaKey").value.trim(),
    label: row.querySelector(".schemaLabel").value.trim(),
    type: row.querySelector(".schemaType").value,
    required: row.querySelector(".schemaRequired").checked,
    options: row.querySelector(".schemaType").value === "select"
      ? row.querySelector(".schemaOptions").value.split(",").map(s => s.trim()).filter(Boolean)
      : []
  };
}

// === ドロップ位置を計算 ===
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".schemaRow:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// === プレビュー描画 ===
function renderPreview(schema) {
  const container = document.getElementById("previewContainer");
  container.innerHTML = "";

  schema.forEach(field => {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = field.label;

    let input;
    switch (field.type) {
      case "file":
        input = document.createElement("input");
        input.type = "file";
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
    if (field.required) input.required = true;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });
}

// === 初期化 ===
document.addEventListener("DOMContentLoaded", async () => {
  let schema = await loadSchema();
  renderEditor(schema);

  document.getElementById("addFieldBtn").onclick = () => {
    schema.push({ key:"", label:"", type:"text", required:false, options:[] });
    renderEditor(schema);
  };
});