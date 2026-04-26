document.addEventListener("DOMContentLoaded", function () {
    
    









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
