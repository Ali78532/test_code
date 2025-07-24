function pauseAll() {
  document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
}

// التعامل مع عرض القائمة والمحتوى والدعم لزر الرجوع
const menuEl = document.getElementById('menu');
const contentEl = document.getElementById('content-area');

document.querySelectorAll('.units-list li').forEach(li => {
  li.addEventListener('click', () => loadUnit(li.dataset.unit, li));
});

function loadUnit(unit, clickedLi) {
  // تمييز العنصر النشط
  document.querySelectorAll('.units-list li').forEach(el => el.classList.remove('active'));
  clickedLi.classList.add('active');

  fetch(`${unit}/content.html`)
    .then(res => res.text())
    .then(html => {
      contentEl.innerHTML = html;
      menuEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      history.pushState({unit}, '', '');
    });
}

// دعم زر الرجوع
window.addEventListener('popstate', e => {
  if (!e.state) {
    contentEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    document.querySelectorAll('.units-list li').forEach(el => el.classList.remove('active'));
  }
});

// تشغيل الصوت
function play(id) {
  pauseAll();
  const audio = document.getElementById(id);
  if (audio) audio.play();
}