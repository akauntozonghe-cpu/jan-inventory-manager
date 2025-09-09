import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, where,
  updateDoc, deleteDoc, doc, serverTimestamp, setDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqPckkK9FkDkeVrYjoZQA1Y3HuOGuUGwI",
  authDomain: "inventory-app-312ca.firebaseapp.com",
  projectId: "inventory-app-312ca"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addEventListener("DOMContentLoaded", () => {
  const name = sessionStorage.getItem("responsibilityName") || "未設定";
  const roleRaw = sessionStorage.getItem("responsibilityRole")?.toLowerCase();
  const roleJP = roleRaw === "admin" ? "管理者" : roleRaw === "user" ? "責任者" : "未設定";
  const isAdmin = roleJP === "管理者";

  document.getElementById("loginUser").textContent = `ログイン中: ${name}（${roleJP}）`;
  
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
if (saveSettingsBtn) {
  saveSettingsBtn.onclick = () => {
    const settingName = document.getElementById("settingName")?.value.trim();
    const settingRole = document.getElementById("settingRole")?.value;
    if (!settingName) return alert("名前を入力してください");
    sessionStorage.setItem("responsibilityName", settingName);
    sessionStorage.setItem("responsibilityRole", settingRole);
    alert("設定を保存しました。ページを再読み込みしてください");
  };
}
  
  // 商品登録
  registerBtn.onclick = async () => {
    const data = {
      productName: productName.value,
      janCode: janCodeInput.value,
      company: company.value,
      lotNumber: lotNumber.value,
      unit: unit.value,
      user: name,
      role: roleJP,
      timestamp: serverTimestamp()
    };
    try {
      await addDoc(collection(db, "products"), data);
      alert("登録しました");
    } catch (e) {
      alert("登録失敗: " + e.message);
    }
  };

  // 商品検索
  searchBtn.onclick = async () => {
    const keyword = searchInput.value.trim();
    const q = query(collection(db, "products"), where("janCode", "==", keyword));
    const snapshot = await getDocs(q);
    searchResults.innerHTML = "";
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<strong>${d.productName}</strong> (${d.company})<br>JAN: ${d.janCode}`;
      if (isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "削除";
        delBtn.onclick = async () => {
          await deleteDoc(doc(db, "products", docSnap.id));
          alert("削除しました");
          div.remove();
        };
        div.appendChild(delBtn);
      }
      searchResults.appendChild(div);
    });
  };

  // 管理者連絡
  contactSendBtn.onclick = async () => {
    const msg = contactMsg.value.trim();
    if (!msg) return alert("メッセージを入力してください");
    try {
      await addDoc(collection(db, "messages"), {
        message: msg,
        user: name,
        role: roleJP,
        timestamp: serverTimestamp()
      });
      contactStatus.textContent = "送信しました";
      contactMsg.value = "";
    } catch (e) {
      contactStatus.textContent = "送信失敗: " + e.message;
    }
  };

  // CSV出力（責任者）
  exportCsvBtn.onclick = async () => {
    const q = query(collection(db, "products"), where("user", "==", name));
    const snapshot = await getDocs(q);
    let csv = "品名,会社名,JANコード,登録日時\n";
    snapshot.forEach(doc => {
      const d = doc.data();
      csv += `${d.productName},${d.company},${d.janCode},${d.timestamp?.toDate?.().toLocaleString()}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 一覧表示
  loadAllBtn.onclick = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    allProducts.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const div = document.createElement("div");
      div.textContent = `${d.productName} (${d.company}) - JAN: ${d.janCode}`;
      allProducts.appendChild(div);
    });
  };

  // JANコードスキャン（登録）
  startScanBtn.onclick = () => {
    scannerWrapper.style.display = "block";
    Quagga.init({
      inputStream: { name: "Live", type: "LiveStream", target: scanner },
      decoder: { readers: ["ean_reader"] }
    }, err => {
      if (err) return console.error(err);
      Quagga.start();
    });
    Quagga.onDetected(data => {
      janCodeInput.value = data.codeResult.code;
      Quagga.stop();
      scannerWrapper.style.display = "none";
    });
  };

  // JANコードスキャン（検索）
  scanSearchBtn.onclick = () => {
    searchScannerWrapper.style.display = "block";
    Quagga.init({
      inputStream: { name: "Live", type: "LiveStream", target: searchScanner },
      decoder: { readers: ["ean_reader"] }
    }, err => {
      if (err) return console.error(err);
      Quagga.start();
    });
    Quagga.onDetected(data => {
      searchInput.value = data.codeResult.code;
      Quagga.stop();
      searchScannerWrapper.style.display = "none";
    });
  };

  // 画像プレビュー
  photo.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        preview.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 管理者専用機能
  if (isAdmin) {
    addUserBtn.onclick = async () => {
      const name = newUserName.value.trim();
      const number = newUserNumber.value.trim();
      const role = newUserRole.value;
      if (!name || !number) return alert("名前と番号を入力してください");
      await addDoc(collection(db, "users"), { name, number, role });
      alert("ユーザーを追加しました");
    };

    deleteUserBtn.onclick = async () => {
      const number = deleteUserNumber.value.trim();
      if (!number || !confirm("本当に削除しますか？")) return;
      const q = query(collection(db, "users"), where("number", "==", number));
      const snap = await getDocs(q);
      snap.forEach(doc => deleteDoc(doc.ref));
      alert("削除しました");
    };

    // ログ表示（グリッド形式）
    loadLogsBtn.onclick = async () => {
      const date = logDateFilter.value;
      const user = logUserFilter.value.trim();
      const snap = await getDocs(collection(db, "logs"));
      const filtered = snap.docs.filter(doc => {
        const d = doc.data();
        const matchDate = date ? d.timestamp?.toDate().toISOString().startsWith(date) : true;
        const matchUser = user ? d.userName.includes(user) : true;
        return matchDate && matchUser;
      });

      logList.innerHTML = filtered.length
        ? filtered.map(doc => {
            const d = doc.data();
            const time = d.timestamp?.toDate().toLocaleString() || "不明";
            const roleClass = d.role === "admin" ? "badge-admin" : "badge-user";
            const badge = `<span class="badge ${roleClass}">${d.role === "admin" ? "管理者" : "責任者"}</span>`;
            return `
              <div class="log-grid">
                <div>${time}</div>
                <div>${d.userName} ${badge}</div>
                <div>${d.action}</div>
              </div>
            `;
          }).join("")
        : "<div>該当する履歴はありません。</div>";
    };

    exportLogsBtn.onclick = async () => {
      const snap = await getDocs(collection(db, "

