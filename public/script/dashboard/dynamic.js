const burger_btn = document.getElementById("burger-button");

burger_btn.addEventListener("click", function () {
  var burger_menu = document.getElementById("burger-menu");

  if (
    burger_menu.style.display === "block" ||
    burger_menu.style.display === ""
  ) {
    burger_menu.style.display = "none";
  } else {
    burger_menu.style.display = "block";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("plusBtn");
  const menu = document.getElementById("dropdownMenu");

  if (!btn || !menu) return; 

  btn.addEventListener("mouseenter", () => {
    menu.style.display = "block";
  });

  btn.addEventListener("mouseleave", (e) => {
    if (!menu.contains(e.relatedTarget)) {
      menu.style.display = "none";
    }
  });

  menu.addEventListener("mouseenter", () => {
    menu.style.display = "block";
  });

  menu.addEventListener("mouseleave", (e) => {
    if (e.relatedTarget !== btn) {
      menu.style.display = "none";
    }
  });
});

