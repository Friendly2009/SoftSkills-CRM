const add_btn = document.getElementById("add_btn");
const dark_phone = document.getElementById("dark_phone");
const add_teacher_exit_btn = document.getElementById("add_teacher_exit_btn");

add_btn.addEventListener('click',function() {
    dark_phone.style.visibility = "visible";
});
add_teacher_exit_btn.addEventListener("click", function() {
    dark_phone.style.visibility = "collapse";
});