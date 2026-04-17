async function updateUI() {
    try {
        const responseOfUser = await fetch('/data/getUser');

        if (!responseOfUser.ok) {
            throw new Error('Не удалось получить данные');
        }
        let user_data = await responseOfUser.json();

        let name_infoHTML = document.getElementById('name_info');
        if (name_infoHTML) {
            name_infoHTML.textContent = user_data.role + "|" + user_data.company_name;
        }

        console.log("Данные получены:", user_data);
    } catch (ex) {
        console.error("Ошибка на клиенте:", ex);
    }
}

updateUI();