(async () => {
  let idCount = 0;

  try {
    const teacher_table_tbody = document.getElementById("teacher_table_tbody");
    const getTeacher_response = await fetch("/data/getTeacher");
    const teachers = await getTeacher_response.json();

    if (teachers.data && teachers.data.length > 0) {
      teachers.data.forEach((element) => {
        idCount = element.id;
        if (!element.avatar) {
          element.avatar = "/img/user/dashboard/user-solid.png";
        }
        teacher_table_tbody.insertAdjacentHTML(
          "beforeend",
          `
          <tr class="teacher-row"> 
              <td><img class="avatar" src="${element.avatar}"/></td>
              <td>${element.fullname}</td>
              <td>${element.gender}</td>
              <td>${element.birthday}</td>
              <td>${element.contacts}</td>
              <td><button class="delete-btn" teacherId="${element.id}">Удалить</button></td>
          </tr>
          `,
        );
      });
    }
  } catch (ex) {
    console.error("Ошибка загрузки:", ex);
  }

  const add_btn = document.getElementById("add_btn");
  const dark_phone = document.getElementById("dark_phone");
  const add_teacher_exit_btn = document.querySelectorAll("#add_teacher_exit_btn");

  if (add_btn && dark_phone) {
    add_btn.addEventListener("click", () => {
      dark_phone.style.visibility = "visible";
    });
  }

  add_teacher_exit_btn.forEach((el) => {
    el.addEventListener("click", () => {
      if (dark_phone) dark_phone.style.visibility = "collapse";
    });
  });

  if (idCount !== 0) {
    const teacherDelBtns = document.querySelectorAll(".delete-btn");
    teacherDelBtns.forEach(element => {
      element.addEventListener("click", async function (e) {
        if (confirm("Вы действительно хотите удалить этого учителя?")) {
          try {
            const tid = this.getAttribute('teacherId');
            const response = await fetch(`/api/deleteteacher/${tid}`, {
              method: 'DELETE'
            });

            if (response.ok) {
              const teachersRow = this.closest('tr');
              if (teachersRow) teachersRow.remove();
            }
          } catch (ex) {
            console.error("Ошибка при удалении:", ex);
          }
        }
      });
    });
  }

  const selector = document.getElementById("countrySelector");
  const dropdown = document.getElementById("countryList");
  const arrow = selector?.querySelector(".dropdown-arrow");
  const invisiblePhoneInput = document.getElementById("invisiblePhoneInput");
  const telInput = document.getElementById('telInput');
  let _code = "";
  if (selector && dropdown) {
    selector.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
      if (arrow) arrow.style.transform = dropdown.classList.contains("active") ? "rotate(180deg)" : "rotate(0deg)";
    });

    dropdown.querySelectorAll("li").forEach((item) => {
      item.addEventListener("click", () => {
        const code = item.getAttribute("data-code");
        if (document.getElementById("selectedCode")) {
          _code = code;
          document.getElementById("selectedCode").textContent = code;
        }
        dropdown.classList.remove("active");
        if (arrow) arrow.style.transform = "rotate(0deg)";
      });
    });
  }

  telInput.addEventListener("input", function(e) {
    invisiblePhoneInput.setAttribute('value',_code + telInput.value);
  });

  document.getElementById("female")?.addEventListener("click", () => {
    const gi = document.getElementById('gender'); if (gi) gi.value = "Жен";
  });
  document.getElementById("male")?.addEventListener("click", () => {
    const gi = document.getElementById('gender'); if (gi) gi.value = "Муж";
  });

})();
