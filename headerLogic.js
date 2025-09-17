function toggleMenu() {
  const menu = document.getElementById("headerMenu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
}

function closeMenu(event) {
  if (event.target.tagName !== "A") {
    const menu = document.getElementById("headerMenu");
    if (menu) menu.style.display = "none";
  }
}

function goHome() {
  window.location.href = "home.html";
}