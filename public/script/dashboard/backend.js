async function loadUserData() {
    try {
        const responseOfUser = await fetch('/data/getUser');

        if (!responseOfUser.ok) {
            throw new Error('Не удалось получить данные');
        }
        
        const user_data = await responseOfUser.json();

        const name_infoHTML = document.getElementById('name_info');
        
        if (name_infoHTML) {
            name_infoHTML.textContent = `${user_data.userRole} | ${user_data.full_name}`;
            
            name_infoHTML.style.cursor = "pointer";
        }

        console.log("Данные получены:", user_data);
    } catch (ex) {
        console.error("Ошибка на клиенте:", ex);
    }
}

loadUserData();
