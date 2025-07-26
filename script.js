// project-root/script.js

let currentAudio = null;
let currentTopic = '';
const audioCache = {};             // لتخزين مسبق للملفات
let loadingTimers = new Map();     // لتخزين مؤقتات "جاري التحميل…"
let preloadSessionToken = 0;       // رمزٌ متغير لوقف preload عند التنقل

// الحالة الابتدائية
history.replaceState({ topic: null }, '', '');

const menuEl    = document.getElementById('menu');
const listEl    = document.getElementById('topics-list');
const contentEl = document.getElementById('content-area');

// 1) بناء القائمة مع الفواصل
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

// 2) تحميل الموضوع واستدعاء الـpreload المتسلسل
function loadTopic(topic, clickedLi) {
  currentTopic = topic;
  listEl.querySelectorAll('li').forEach(el => el.classList.remove('active'));
  clickedLi.classList.add('active');

  // زِد الرمز لبدء جلسة preload جديدة
  preloadSessionToken++;
  const mySession = preloadSessionToken;

  fetch(`${topic}/content.html`)
    .then(r => r.text())
    .then(html => {
      contentEl.innerHTML = html;
      window.scrollTo(0, 0);
      menuEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      history.pushState({ topic }, '', '');

      // اطلاق التحميل المتسلسل في الخلفية مع الجلسة
      preloadSequentialAudio(mySession).catch(console.error);
    });
}

// 3) دعم زر الرجوع
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

// 4) دالة التشغيل مع جدولة "جاري التحميل…" وإلغائها
function playAudio(filename) {
  // إزالة كل عبارات "جاري التحميل…" الحالية
  contentEl.querySelectorAll('.loading-text').forEach(el => el.remove());

  // إيقاف الصوت السابق
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  // العثور على الأيقونة المطابقة
  const selector = `.audio-icon[onclick="playAudio('${filename}')"]`;
  const elem = document.querySelector(selector);
  if (!elem) {
    console.warn('لم أجد أيقونة للصوت لملف:', filename);
    return;
  }

  // إلغاء أي مؤقت سابق
  if (loadingTimers.has(elem)) {
    clearTimeout(loadingTimers.get(elem));
    loadingTimers.delete(elem);
  }

  // جدولة ظهور "جاري التحميل…" بعد 500ms
  const timer = setTimeout(() => {
    const txt = document.createElement('span');
    txt.className = 'loading-text';
    txt.textContent = 'جاري التحميل…';
    elem.insertAdjacentElement('afterend', txt);
  }, 500);
  loadingTimers.set(elem, timer);

  // إنشاء أو استرجاع الصوت من الكاش
  currentAudio = audioCache[filename]
    ? audioCache[filename]
    : new Audio(`${currentTopic}/${filename}`);

  // عند بدء التشغيل (حتى من الكاش)
  currentAudio.addEventListener('playing', () => {
    if (loadingTimers.has(elem)) {
      clearTimeout(loadingTimers.get(elem));
      loadingTimers.delete(elem);
    }
    const t = elem.parentNode.querySelector('.loading-text');
    if (t) t.remove();
  });

  // شغّل الصوت
  currentAudio.play().catch(console.error);
}

// 5) تحميل الملفات الصوتية تباعًا وبجلسة محددة
async function preloadSequentialAudio(sessionToken) {
  const icons = contentEl.querySelectorAll('.audio-icon');
  for (const icon of icons) {
    // إذا خرج المستخدم من الجلسة، توقف
    if (sessionToken !== preloadSessionToken) return;

    const onclick = icon.getAttribute('onclick') || '';
    const match = onclick.match(/playAudio\('(.+?)'\)/);
    if (!match) continue;
    const filename = match[1];

    if (!audioCache[filename]) {
      const audio = new Audio(`${currentTopic}/${filename}`);
      audio.preload = 'auto';
      // انتظر حتى يتحمَّل بما يكفي
      await new Promise(resolve => {
        const onCan = () => {
          audio.removeEventListener('canplaythrough', onCan);
          resolve();
        };
        audio.addEventListener('canplaythrough', onCan);
        audio.load();
      });
      // إذا غادر المستخدم الجلسة فلن نضيف للكاش
      if (sessionToken !== preloadSessionToken) return;
      audioCache[filename] = audio;
    }
  }
}
