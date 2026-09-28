
let scrollTick = false;
window.addEventListener('scroll', function () {
if (scrollTick) return;
scrollTick = true;
requestAnimationFrame(function () {
scrollTick = false;
var y = window.scrollY;
var nav = document.getElementById('nav');
var btt = document.getElementById('btt');
if (nav) nav.classList.toggle('scrolled', y > 60);
if (btt) btt.classList.toggle('show', y > 300);
var activeId = '';
document.querySelectorAll('section[id]').forEach(function (sec) {
var top = sec.offsetTop - 110;
if (y >= top && y < top + sec.offsetHeight) activeId = sec.id;
});
document.querySelectorAll('.nav-link').forEach(function (link) {
link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
});
});
}, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(function(a) {
a.addEventListener('click', function(e) {
var href = this.getAttribute('href');
if (href === '#') return;
var t = document.querySelector(href);
if (t) {
e.preventDefault();
var navCollapse = document.getElementById('navmenu');
var navToggle = document.querySelector('.navbar-toggler');
if (navCollapse && navCollapse.classList.contains('show')) {
navCollapse.classList.remove('show');
if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
}
setTimeout(function() {
window.scrollTo({
top: t.offsetTop - 78,
behavior: 'smooth'
});
}, 50);
}
});
});

var navToggle = document.querySelector('.navbar-toggler');
var navMenu = document.getElementById('navmenu');
if (navToggle && navMenu) {
navToggle.addEventListener('click', function () {
var open = navMenu.classList.toggle('show');
navToggle.setAttribute('aria-expanded', String(open));
});
}

document.addEventListener('keydown', function(e) {
if (e.key === 'Escape') {
if (navMenu) navMenu.classList.remove('show');
}
});

var nlBtn = document.getElementById('nlBtn');
if (nlBtn) {
nlBtn.addEventListener('click', function() {
var emailEl = document.getElementById('nlEmail');
var email = emailEl ? emailEl.value : '';
if (email && email.includes('@')) {
var btn = this;
btn.textContent = 'Subscribed!';
btn.style.background = '#4ade80';
btn.style.color = '#222';
emailEl.value = '';
setTimeout(function() {
btn.textContent = 'Subscribe';
btn.style.background = '';
btn.style.color = '';
}, 3000);
}
});
}

var numAnimated = false;
window.addEventListener('scroll', function() {
var hero = document.getElementById('hero');
if (!numAnimated && hero && window.scrollY > hero.offsetHeight - 300) {
numAnimated = true;
document.querySelectorAll('.snum').forEach(function(el) {
var txt = el.textContent;
var num = parseInt(txt);
var suf = txt.replace(/[0-9]/g, '');
if (isNaN(num)) return;
var start = 0;
var step = Math.ceil(num / 55);
var iv = setInterval(function() {
start += step;
if (start >= num) {
start = num;
clearInterval(iv);
}
el.textContent = start + suf;
}, 1400 / 55);
});
}
}, { passive: true });
