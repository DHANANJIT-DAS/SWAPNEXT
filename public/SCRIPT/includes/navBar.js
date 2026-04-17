document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('ab-dropdown-trigger');
    const menu = document.getElementById('ab-dropdown-menu');

    if (trigger && menu) {
        trigger.addEventListener('click', (e) => {
            menu.classList.toggle('is-open');
            e.stopPropagation();
        });

        document.addEventListener('click', () => menu.classList.remove('is-open'));
    }
});