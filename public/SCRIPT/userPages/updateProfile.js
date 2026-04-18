/**
 * updateProfile.js
 * Tab switching + accordion sections + interactions
 */

/* ─── TAB SWITCHING ─────────────────────────────────────── */

const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
const tabPanels    = document.querySelectorAll('.tab-panel');

function switchTab(tabId) {
  sidebarItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
  tabPanels.forEach(panel => {
    const isTarget = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', isTarget);
  });
  // Close all open accordion sections when switching tabs
  document.querySelectorAll('.form-fields.expanded').forEach(el => {
    el.classList.remove('expanded');
    el.classList.add('collapsed');
  });
  openSections.clear();
  updateAllEditBtns();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

sidebarItems.forEach(item => {
  item.addEventListener('click', () => switchTab(item.dataset.tab));
});

/* ─── ACCORDION SECTIONS ────────────────────────────────── */

const openSections = new Set();

function openSection(id) {
  const fields = document.getElementById(`${id}Fields`);
  if (!fields) return;
  fields.classList.remove('collapsed');
  fields.classList.add('expanded');
  openSections.add(id);
  const editBtn = document.querySelector(`[data-section="${id}"]`);
  if (editBtn) editBtn.textContent = 'Cancel';
  // Focus first input
  const first = fields.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select');
  if (first) setTimeout(() => first.focus(), 260);
}

function closeSection(id) {
  const fields = document.getElementById(`${id}Fields`);
  if (!fields) return;
  fields.classList.remove('expanded');
  fields.classList.add('collapsed');
  openSections.delete(id);
  const editBtn = document.querySelector(`[data-section="${id}"]`);
  if (editBtn) resetEditBtnLabel(id, editBtn);
}

function resetEditBtnLabel(id, btn) {
  const map = {
    password:     'Update',
    twofa:        'Enable',
    sessions:     'View',
    deactivate:   'Deactivate',
    payment:      'Add',
    payout:       'Add',
    currency:     'Edit',
    visibility:   'Edit',
    datasharing:  'Edit',
    connectedapps:'Manage',
    requestdata:  'Request',
    deleteaccount:'Delete',
    name:         'Edit',
    username:     'Edit',
    email:        'Edit',
    phone:        'Edit',
    address:      'Edit',
    about:        'Edit',
  };
  // Special case: phone might be "Add" if empty
  if (id === 'phone') {
    const phoneInput = document.getElementById('phone');
    btn.textContent = (phoneInput && phoneInput.value.trim()) ? 'Edit' : 'Add';
    return;
  }
  btn.textContent = map[id] || 'Edit';
}

function updateAllEditBtns() {
  document.querySelectorAll('.edit-btn[data-section]').forEach(btn => {
    resetEditBtnLabel(btn.dataset.section, btn);
  });
}

// Wire edit buttons
document.querySelectorAll('.edit-btn[data-section]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const id = btn.dataset.section;
    if (openSections.has(id)) {
      closeSection(id);
    } else {
      openSection(id);
    }
  });
});

// Wire cancel/save-close buttons
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeSection(btn.dataset.close));
});

// Escape closes all
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    [...openSections].forEach(id => closeSection(id));
  }
});

/* ─── AVATAR PREVIEW ────────────────────────────────────── */

const avatarInput = document.getElementById('avatarInput');

if (avatarInput) {
  avatarInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;

      // Profile avatar
      const initials = document.getElementById('avatarInitials');
      if (initials) initials.remove();
      let preview = document.getElementById('avatarPreview');
      if (!preview) {
        preview = document.createElement('img');
        preview.id = 'avatarPreview';
        preview.alt = 'Profile photo';
        preview.className = 'profile-avatar';
        const container = document.getElementById('avatarContainer');
        container.insertBefore(preview, container.querySelector('.avatar-overlay'));
      }
      preview.src = src;

      // Nav avatar
      const navImg = document.getElementById('navAvatar');
      const navPh  = document.getElementById('navAvatarPlaceholder');
      if (navImg) {
        navImg.src = src;
      } else if (navPh) {
        const img = document.createElement('img');
        img.src = src; img.id = 'navAvatar'; img.alt = 'avatar'; img.className = 'nav-avatar';
        navPh.replaceWith(img);
      }

      showToast('Photo updated! Save changes to keep it.', 'success');
    };
    reader.readAsDataURL(file);
  });
}

/* ─── LIVE DISPLAY UPDATES ──────────────────────────────── */

const liveFields = [
  { inputs: ['firstName','lastName'], displayId: 'nameDisplay',     fmt: v => v.join(' ').trim() || 'Not set' },
  { inputs: ['username'],             displayId: 'usernameDisplay', fmt: v => v[0] || 'Not set' },
  { inputs: ['email'],                displayId: 'emailDisplay',    fmt: v => v[0] || 'Not set' },
  { inputs: ['phone'],                displayId: 'phoneDisplay',    fmt: v => v[0] || 'Add a number so confirmed guests can get in touch.' },
  { inputs: ['address','city','zip'], displayId: 'addressDisplay',  fmt: v => v.filter(Boolean).join(', ') || 'Not provided' },
  { inputs: ['bio'],                  displayId: 'aboutDisplay',    fmt: v => v[0] || 'Tell us a little about yourself.' },
];

liveFields.forEach(({ inputs, displayId, fmt }) => {
  inputs.forEach(id => {
    const el = document.getElementById(id);
    const display = document.getElementById(displayId);
    if (!el || !display) return;
    el.addEventListener('input', () => {
      const vals = inputs.map(i => (document.getElementById(i) || {}).value?.trim() || '');
      display.textContent = fmt(vals);
    });
  });
});

/* ─── PASSWORD STRENGTH ─────────────────────────────────── */

const newPasswordInput = document.getElementById('newPassword');
const strengthFill     = document.getElementById('strengthFill');
const strengthLabel    = document.getElementById('strengthLabel');

if (newPasswordInput) {
  newPasswordInput.addEventListener('input', function () {
    const val = this.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    if (val.length >= 12) score++;

    const levels = [
      { label: '', color: '#eee', width: '0%' },
      { label: 'Too weak', color: '#e53e3e', width: '20%' },
      { label: 'Weak',     color: '#ed8936', width: '40%' },
      { label: 'Fair',     color: '#ecc94b', width: '60%' },
      { label: 'Strong',   color: '#48bb78', width: '80%' },
      { label: 'Very strong', color: '#38a169', width: '100%' },
    ];
    const lvl = val.length === 0 ? levels[0] : levels[Math.min(score, 5)];
    strengthFill.style.width = lvl.width;
    strengthFill.style.background = lvl.color;
    strengthLabel.textContent = lvl.label;
    strengthLabel.style.color = lvl.color;
  });
}

/* ─── DELETE CONFIRM ────────────────────────────────────── */

const deleteConfirmInput = document.getElementById('deleteConfirm');
const deleteAccountBtn   = document.getElementById('deleteAccountBtn');

if (deleteConfirmInput && deleteAccountBtn) {
  deleteConfirmInput.addEventListener('input', function () {
    deleteAccountBtn.disabled = this.value !== 'DELETE';
  });
}

/* ─── PAYMENT OPTION BUTTONS ────────────────────────────── */

document.querySelectorAll('.payment-option-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    this.closest('.payment-options').querySelectorAll('.payment-option-btn')
      .forEach(b => b.classList.remove('active-opt'));
    this.classList.add('active-opt');
  });
});

/* ─── CARD NUMBER FORMATTING ────────────────────────────── */

const cardInput = document.getElementById('cardNumber');
if (cardInput) {
  cardInput.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 16);
    this.value = v.match(/.{1,4}/g)?.join(' ') || v;
  });
}

const expiryInput = document.getElementById('expiry');
if (expiryInput) {
  expiryInput.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0,2) + ' / ' + v.slice(2);
    this.value = v;
  });
}

/* ─── FORM VALIDATION ───────────────────────────────────── */

const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', function (e) {
    const email = document.getElementById('email');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      e.preventDefault();
      openSection('email');
      showToast('Please enter a valid email address.', 'error');
      email.focus();
      return;
    }
    showToast('Saving your profile…', 'info');
  });
}

/* ─── REVOKE SESSION BUTTONS ────────────────────────────── */

document.querySelectorAll('.revoke-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const item = this.closest('.session-item');
    if (item) {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-12px)';
      item.style.transition = 'all 0.3s ease';
      setTimeout(() => item.remove(), 300);
      showToast('Device signed out.', 'success');
    }
  });
});

/* ─── TOAST ─────────────────────────────────────────────── */

function showToast(message, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const colors = { error: '#C13515', success: '#38a169', info: '#222' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: colors[type] || colors.info,
    color: '#fff', padding: '13px 22px', borderRadius: '10px',
    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: '600',
    zIndex: '9999', boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
    opacity: '0', transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
    pointerEvents: 'none', maxWidth: '90vw', textAlign: 'center',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ─── INIT ──────────────────────────────────────────────── */

// Ensure all panels & fields start correct
document.querySelectorAll('.form-fields').forEach(el => {
  el.classList.add('collapsed');
  el.classList.remove('expanded');
});