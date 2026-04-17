document.addEventListener('DOMContentLoaded', () => {
    const open = document.getElementById('sidebar-open');
    const close = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('settings-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const toggle = (val) => {
        sidebar.classList.toggle('open', val);
        overlay.classList.toggle('active', val);
        document.body.style.overflow = val ? 'hidden' : 'auto';
    };

    if(open) open.onclick = () => toggle(true);
    if(close) close.onclick = () => toggle(false);
    if(overlay) overlay.onclick = () => toggle(false);
});