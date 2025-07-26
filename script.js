// project-root/script.js

let currentAudio = null;
let currentTopic = '';
let loadingTimers = new Map();  // للاحتفاظ بمؤقتات التحميل لكل أيقونة

// الحالة الابتدائية
history.replaceState({ topic: null }, '', '');

const menuEl    = document.getElementById('menu');
const listEl    = document.getElementById('topics-list');
const contentEl = document.getElementById('content-area');

// بناء القائمة
fetch('topics.json')
  .then(res => res.json())
  .then(topics => {
    let lastGroup = null;
    topics.forEach(topic => {
      const group = topic.group || 'عام';
      if (group !== lastGroup) {
        const sep = document.createElement('li');
        sep.className = 'separator';
        sep.textContent = `--------(${group})--------`;
        listEl.appendChild(sep);
        lastGroup = group;
      }
      const li = document.createElement('li');
      li.textContent   = topic.title;
      li.dataset.topic = topic.id;
      li.addEventListener('click', () => loadTopic(topic.id, li));
      listEl.appendChild(li);
    });
  })
  .catch(err => console.error('فشل تحميل topics.json:', err));

function loadTopic(topic, clickedLi) {
  currentTopic = topic;
  listEl.querySelectorAll('li').forEach(el => el.classList.remove('active'));
  clickedLi.classList.add('active');

  fetch(`${topic}/content.html`)
    .then(r => r.text())
    .then(html => {
      contentEl.innerHTML = html;
      window.scrollTo(0, 0);
      menuEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      history.pushState({ topic }, '', '');
    });
}

window.addEventListener('popstate', e => {
  if (!e.state || e.state.topic === null) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    contentEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    listEl.querySelectorAll('li').forEach(el => el.classList.remove('active'));
  }
});

function playAudio(filename) {
  // حدّد العنصر <span class="audio-icon"> المطابق بالـ onclick
  const selector = `.audio-icon[onclick="playAudio('${filename}')"]`;
  const elem = document.querySelector(selector);
  if (!elem) {
    console.warn('لم أجد أيقونة للصوت لملف:', filename);
    return;
  }

  // 1. أوقف أي صوت سابق واِمسح نص التحميل عنه
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  // ألغ المؤقت القديم إن وجد
  if (loadingTimers.has(elem)) {
    clearTimeout(loadingTimers.get(elem));
    loadingTimers.delete(elem);
  }
  // اِمسح أي عبارة تحميل ظاهرة
  const prev = elem.parentNode.querySelector('.loading-text');
  if (prev) prev.remove();

  // 2. جدولة ظهور "جاري التحميل…" بعد 500ms
  const timer = setTimeout(() => {
    const txt = document.createElement('span');
    txt.className = 'loading-text';
    txt.textContent = 'جاري التحميل…';
    elem.insertAdjacentElement('afterend', txt);
  }, 500);
  loadingTimers.set(elem, timer);

  // 3. إنشاء وتشغيل الصوت
  currentAudio = new Audio(`${currentTopic}/${filename}`);
  currentAudio.load();

  // عند بدء التشغيل (حتى لو من الكاش)
  currentAudio.addEventListener('playing', () => {
    // ألغي المؤقت لو لم ينفذ بعد
    if (loadingTimers.has(elem)) {
      clearTimeout(loadingTimers.get(elem));
      loadingTimers.delete(elem);
    }
    // اِمسح عبارة التحميل إن ظهرت
    const t = elem.parentNode.querySelector('.loading-text');
    if (t) t.remove();
  });

  currentAudio.play().catch(console.error);
}
