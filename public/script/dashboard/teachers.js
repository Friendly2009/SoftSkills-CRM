document.addEventListener("DOMContentLoaded", async function () {
  try {
    let teacher_table_tbody = document.getElementById("teacher_table_tbody");

    const getTeacher_response = await fetch("/data/getTeacher");
    const teachers = await getTeacher_response.json();
    teachers.data.forEach((element) => {
      if (element.avatar == null || element.avatar == "") {
        element.avatar = "/img/user/dashboard/user-solid.png";
      }
      teacher_table_tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr id="teacherrow">
            <td><img class="avatar" src="${element.avatar}"/></td>
            <td>${element.fullname}</td>
            <td>${element.gender}</td>
            <td>${element.birthday}</td>
            <td>${element.contacts}</td>
            <td><button class="delete-btn" teacherId="${element.id}" id="teacherDelBtn">Удалить</button></td>
        </tr>
        `,
      );
    });
  } catch (ex) {
    alert(ex);
  }

  const add_btn = document.getElementById("add_btn");
  const dark_phone = document.getElementById("dark_phone");
  const add_teacher_exit_btn = document.querySelectorAll("#add_teacher_exit_btn",);

  add_btn.addEventListener("click", function () {
    dark_phone.style.visibility = "visible";
  });
  add_teacher_exit_btn.forEach((el) => {
    el.addEventListener("click", function () {
      dark_phone.style.visibility = "collapse";
    });
  });

  const selector = document.getElementById("countrySelector");
  const dropdown = document.getElementById("countryList");
  const selectedCodeDisplay = document.getElementById("selectedCode");
  const arrow = selector.querySelector(".dropdown-arrow");
  const invisiblePhoneInput = document.getElementById('invisiblePhoneInput');
  const telInput = document.getElementById("telInput");
  const genderInput = document.getElementById('gender');

  selector.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
    arrow.style.transform = dropdown.classList.contains("active")
      ? "rotate(180deg)"
      : "rotate(0deg)";
  });

  dropdown.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", (e) => {
      const code = item.getAttribute("data-code");
      selectedCodeDisplay.textContent = code;
      invisiblePhoneInput.value = code + telInput.value;
      invisiblePhoneInput.focus();
      dropdown.classList.remove("active");
      if (arrow) arrow.style.transform = "rotate(0deg)";
    });
  });
  document.getElementById("female").addEventListener("click", () => {
    genderInput.value = "Жен"
  });
  document.getElementById("male").addEventListener("click", () => {
    genderInput.value = "Муж"
  })
  document.addEventListener("click", () => {
    dropdown.classList.remove("active");
    arrow.style.transform = "rotate(0deg)";
  });

  document.getElementById('addTeacherForm').addEventListener('submit', function (e) {
    const fullname = this.querySelector('input[name="fullname"]').value.trim();
    const birthday = this.querySelector('input[name="birthday"]').value;
    const gender = this.querySelector('input[name="ender"]:checked');
    const phone = document.getElementById('invisiblePhoneInput').value.trim();

    let errorMessage = "";

    if (!fullname) {
      errorMessage = "Введите ФИО педагога";
    } else if (!birthday) {
      errorMessage = "Укажите дату рождения";
    } else if (!gender) {
      errorMessage = "Выберите пол (М или Ж)";
    } else if (!phone || phone.length < 5) {
      errorMessage = "Введите корректный номер телефона";
    }

    if (errorMessage) {
      e.preventDefault();
    }
  });
  const teacherDelBtns = document.querySelectorAll("#teacherDelBtn");
  teacherDelBtns.forEach(element => {
    element.addEventListener("click", function (e) {
      if (confirm("Вы действительно хотите удалить этого учителя?")) {
        try {
          const response = fetch(`api/deleteteacher/${e.currentTarget.getAttribute('teacherId')}`, {
            method: 'delete'
          });
          if (response.ok) {
            const teachersRow = e.currentTarget.closest('#teacherrow');
            teachersRow.remove();
          }
        } catch (ex) {
          console.log(ex);
        }
      }
    });
  });
});
