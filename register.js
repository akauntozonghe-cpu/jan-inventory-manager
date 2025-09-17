let qrReaderInstance = null;

function startScan(targetId) {
  document.getElementById("qrOverlay").style.display = "flex";

  if (!qrReaderInstance) {
    qrReaderInstance = new Html5Qrcode("qr-reader");
  }

  qrReaderInstance.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById(targetId).value = decodedText;
      stopScan(); // 読み取り成功 → 自動閉じる
    },
    (errorMessage) => {
      console.warn("読み取り失敗:", errorMessage);
    }
  );
}

function stopScan() {
  if (qrReaderInstance) {
    qrReaderInstance.stop().then(() => {
      document.getElementById("qrOverlay").style.display = "none";
    }).catch((err) => {
      console.error("停止失敗:", err);
      document.getElementById("qrOverlay").style.display = "none";
    });
  }
}

function closeQR() {
  stopScan(); // 手動閉じるボタン対応
}

function scanJAN() {
  startScan("janInput");
}
function scanCategory() {
  startScan("categoryLarge");
}
function scanLocation() {
  startScan("location");
}