export function evaluateChangeRequest(request) {
  const result = {
    判定: "要確認",
    理由: []
  };

  // 数量が大幅に増えている場合 → 否認候補
  const qtyBefore = parseInt(request.変更前.数量);
  const qtyAfter = parseInt(request.変更後.数量);
  if (qtyAfter > qtyBefore * 2) {
    result.判定 = "否認候補";
    result.理由.push("数量が2倍以上に増加しています");
  }

  // 保管場所が空欄 → 否認候補
  if (!request.変更後.保管場所 || request.変更後.保管場所.trim() === "") {
    result.判定 = "否認候補";
    result.理由.push("保管場所が未入力です");
  }

  // 数量が微調整（±1以内） → 承認候補
  if (Math.abs(qtyAfter - qtyBefore) <= 1) {
    result.判定 = "承認候補";
    result.理由.push("数量変更が微調整レベルです");
  }

  // 登録者が責任者で、変更理由が履歴に存在する → 承認候補
  if (request.権限 === "責任者" && request.変更理由 && request.変更理由.includes("誤登録")) {
    result.判定 = "承認候補";
    result.理由.push("責任者による誤登録修正です");
  }

  // 理由が空欄 → 要確認
  if (!request.変更理由 || request.変更理由.trim() === "") {
    result.理由.push("変更理由が未記入です");
  }

  return result;
}