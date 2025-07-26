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
        sep.textContent = `--------( ${group} )--------`;
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
	  preloadAllAudio();
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
  // 0. إزالة كل عبارات "جاري التحميل…" الحالية
  contentEl.querySelectorAll('.loading-text').forEach(el => el.remove());

  // 1. توقف عن أي صوت سابق
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  // 2. جدولة ظهور "جاري التحميل…" بعد 500ms للأيقونة المضغوطة
  const selector = `.audio-icon[onclick="playAudio('${filename}')"]`;
  const elem = document.querySelector(selector);
  if (!elem) return console.warn('لم أجد أيقونة للصوت لملف:', filename);

  // إلغاء مؤقت سابق إن وُجد
  if (elem._loadingTimer) {
    clearTimeout(elem._loadingTimer);
    elem._loadingTimer = null;
  }

  elem._loadingTimer = setTimeout(() => {
    const txt = document.createElement('span');
    txt.className = 'loading-text';
    txt.textContent = 'جاري التحميل…';
    elem.insertAdjacentElement('afterend', txt);
  }, 500);

  // 3. إنشاء وتشغيل الصوت
  currentAudio = audioCache[filename] || new Audio(`${currentTopic}/${filename}`);
  currentAudio.load();

  currentAudio.addEventListener('playing', () => {
    // عند بدء الصوت: ألغِ المؤقت ونظِّف العبارة
    if (elem._loadingTimer) {
      clearTimeout(elem._loadingTimer);
      elem._loadingTimer = null;
    }
    const t = elem.parentNode.querySelector('.loading-text');
    if (t) t.remove();
  });

  currentAudio.play().catch(console.error);
}

// كائن للاحتفاظ بمسبقات التحميل
const audioCache = {};

function preloadAllAudio() {
  // اجمع كل span.audio-icon الموجودة
  contentEl.querySelectorAll('.audio-icon').forEach(icon => {
    // استخلص اسم الملف من onclick، مثلاً "foo.m4a"
    const onclick = icon.getAttribute('onclick'); // e.g. "playAudio('foo.m4a')"
    const match = onclick.match(/playAudio\('(.+?)'\)/);
    if (match) {
      const filename = match[1];
      // إذا لم يكن محمّلاً مسبقاً
      if (!audioCache[filename]) {
        const audio = new Audio(`${currentTopic}/${filename}`);
        audio.preload = 'auto';  // طلب تحميل مسبق كامل
        audio.load();
        audioCache[filename] = audio;
      }
    }
  });
}
