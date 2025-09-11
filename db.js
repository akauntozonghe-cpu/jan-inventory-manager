import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

const db = getDatabase();

// 商品登録
export async function registerProduct(data) {
  const newRef = push(ref(db, "products"));
  await set(newRef, data);
  await logHistory("商品登録", data.JANコード, data.登録者, data);
}

// 変更申請
export async function submitChangeRequest(data) {
  const reqRef = push(ref(db, "changeRequests"));
  await set(reqRef, data);
  await logHistory("変更申請", data.商品ID, data.申請者, data);
}

// 問題報告
export async function submitReport(data) {
  const reportRef = push(ref(db, "reports"));
  await set(reportRef, data);
  await logHistory("問題報告", data.JANコード, data.報告者, data);
}

// 操作履歴の記録
export async function logHistory(type, targetId, actor, detail) {
  const historyRef = push(ref(db, "history"));
  await set(historyRef, {
    操作種別: type,
    対象ID: targetId,
    操作者: actor,
    日時: new Date().toISOString(),
    詳細: detail
  });
}

// バージョン履歴の追加（管理者専用）
export async function addVersionEntry(ver) {
  const versionRef = push(ref(db, "versionHistory"));
  await set(versionRef, ver);
}

// ユーザー情報の取得
export async function getUserInfo(userId) {
  const snapshot = await get(ref(db, "users/" + userId));
  return snapshot.val();
}