(function () {
  var STORAGE_KEY = "theme";
  var toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  var current = document.documentElement.getAttribute("data-theme") || "light";
  apply(current);

  toggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* localStorage unavailable (private mode) — theme still applies for this page view */
    }
    apply(next);
  });
})();
