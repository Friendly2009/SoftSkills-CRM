const burger_btn = document.getElementById("burger-button");

burger_btn.addEventListener("click", function () {

  var burger_menu = document.getElementById("burger-menu");

  if (burger_menu.style.display === "block" || burger_menu.style.display === "") {
    burger_menu.style.display = "none"; 
  } else {
    burger_menu.style.display = "block";
  }
});
