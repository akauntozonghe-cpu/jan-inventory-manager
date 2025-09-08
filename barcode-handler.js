export function setupBarcodeInput(onSubmitCallback) {
  const input = document.getElementById("barcodeInput");
  const scanBtn = document.getElementById("scanBtn");

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        onSubmitCallback(input.value.trim());
      }
    });
  }

  if (scanBtn) {
    scanBtn.addEventListener("click", () => {
      const args = {
        resultFunction: function(result) {
          input.value = result.code;
          onSubmitCallback(result.code);
        }
      };
      new WebCodeCamJS("#barcode-canvas").init(args).play();
    });
  }
}