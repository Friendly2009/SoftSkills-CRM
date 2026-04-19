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
//-----------------------------------------------------------------//
document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("plusBtn");
  const menu = document.getElementById("dropdownMenu");

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
//-----------------------------------------------------------------//
const sectionsContentMap = {
  analityc: `
    <h1>Аналитика</h1>
  `,
  lessons: `
    <h1>Уроки</h1>
  `,
  tasks: `
    <h1>Задачи</h1>
  `,
  clients: `
    <h1>Клиенты</h1>
  `,
  groups: `
    <h1>Группы</h1>
  `,
  teachers: `
    <h1>Учителя</h1>
  `,
  finance: `
    <h1>Финансы</h1>
  `,
  abonements: `
    <h1>Абонементы</h1>
  `,
  leaders: `
    <h1>Лидеры</h1>
  `,
  legalEntity: `
   <h1>Юр. лица</h1>
  `,
  informer: `
    <h1>Информер</h1>
  `,
  security: `
    <h1>Доступ в CRM</h1>
  `,
};
const placeholder_content = document.getElementById("placeholder-content");
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach((item) => {
  item.addEventListener("click", function () {
    const type = item.getAttribute("screen_type");

    if (sectionsContentMap[type]) {
      placeholder_content.innerHTML = sectionsContentMap[type];
    }
  });
});
