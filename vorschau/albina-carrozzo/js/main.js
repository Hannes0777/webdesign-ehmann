const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');

toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));
