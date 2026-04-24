document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.filter-btn');
    const rows = document.querySelectorAll('#clientTable tbody tr');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.getAttribute('data-type');

            rows.forEach(row => {
                if (type === 'all' || row.getAttribute('data-type') === type) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    document.querySelector('#clientTable').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Вы уверены, что хотите удалить этого клиента?')) {
                e.target.closest('tr').remove();
            }
        }
    });
});