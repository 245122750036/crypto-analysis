// Dummy theme switcher
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
    });
  }
});
