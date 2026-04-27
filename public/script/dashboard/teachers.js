document.addEventListener("DOMContentLoaded", async function () {
  try {
    let teacher_table_tbody = document.getElementById("teacher_table_tbody");

    const getTeacher_response = await fetch("/data/getTeacher");
    const teachers = await getTeacher_response.json(); //id avatar name subject company_id
    teachers.data.forEach((element) => {
        if(element.avatar == null || element.avatar == ""){
            element.avatar = "/img/user/dashboard/user-solid.png";
        }
        teacher_table_tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
            <td><img class="avatar" src="${element.avatar}"/></td>
            <td>${element.name}</td>
            <td>${element.gender}</td>
            <td>${element.birthday}</td>
            <td>${element.contact}</td>
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
  const add_teacher_exit_btn = document.getElementById("add_teacher_exit_btn");
  let tableHTML = `
    <tr>
     <td><img class="avatar" /></td>
     <td>Иванов Иван Иванович</td>
     <td>Английский B1</td>
     <td>Английский</td>
    <td><button class="delete-btn">Удалить</button></td>
    </tr>`;

  add_btn.addEventListener("click", function () {
    dark_phone.style.visibility = "visible";
  });
  add_teacher_exit_btn.addEventListener("click", function () {
    dark_phone.style.visibility = "collapse";
  });
});
