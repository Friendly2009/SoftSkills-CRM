document.addEventListener("DOMContentLoaded", async function () {
  try {
    let teacher_table_tbody = document.getElementById("teacher_table_tbody");

    const getTeacher_response = await fetch("/data/getTeacher");
    const teachers = await getTeacher_response.json(); //id avatar name subject company_id
    teachers.data.forEach((element) => {
      if (element.avatar == null || element.avatar == "") {
        element.avatar = "/img/user/dashboard/user-solid.png";
      }
      teacher_table_tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
            <td><img class="avatar" src="${element.avatar}"/></td>
            <td>${element.fullname}</td>
            <td>${element.gender}</td>
            <td>${element.birthday}</td>
            <td>${element.contacts}</td>
            <td><button class="delete-btn">Удалить</button></td>
        </tr>
        `,
      );
    });
  } catch (ex) {
    alert(ex);
  }

  const add_btn = document.getElementById("add_btn");
  const dark_phone = document.getElementById("dark_phone");
  const add_teacher_exit_btn = document.querySelectorAll(
    "#add_teacher_exit_btn",
  );

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
      alert(invisiblePhoneInput.value);
      invisiblePhoneInput.focus();
      dropdown.classList.remove("active");
      if (arrow) arrow.style.transform = "rotate(0deg)";
    });
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("active");
    arrow.style.transform = "rotate(0deg)";
  });
});
