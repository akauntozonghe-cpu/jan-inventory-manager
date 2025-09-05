// toast.js
export function showToast(message, type = "info", duration = 2000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.top = "1rem";
    container.style.right = "1rem";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "0.5rem";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.padding = "0.8rem 1.2rem";
  toast.style.borderRadius = "4px";
  toast.style.color = "#fff";
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  // 種類ごとの色分け
  switch (type) {
    case "success":
      toast.style.background = "#4caf50"; // 緑
      break;
    case "error":
      toast.style.background = "#f44336"; // 赤
      break;
    case "warning":
      toast.style.background = "#ff9800"; // オレンジ
      break;
    default:
      toast.style.background = "#333"; // デフォルト
  }

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}