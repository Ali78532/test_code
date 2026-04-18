// project-root/script.js

let currentAudio = null;
let currentTopic = '';
const audioCache = {};             // لتخزين مسبق للملفات
let loadingTimers = new Map();     // لتخزين مؤقتات "جاري التحميل…"
let preloadSessionToken = 0;       // رمزٌ متغير لوقف preload عند التنقل

// 1) بناء القائمة مع الفواصل
fetch('topics.json')
  .then(res => res.json())
  .then(topics => {
    let lastGroup = null;
    topics.forEach(topic => {
      const group = topic.group || '';
      if (group !== lastGroup) {
        const sep = document.createElement('li');
        sep.className = 'separator';
        sep.textContent = group;
        listEl.appendChild(sep);
        lastGroup = group;
      }
      const li = document.createElement('li');
      li.textContent   = topic.title;
      li.dataset.topic = topic.id;
      // تمرير true لتغيير الـ hash في شريط العنوان عند النقر اليدوي
      li.addEventListener('click', () => loadTopic(topic.id, li, true)); 
      listEl.appendChild(li);
    });

    // --- التحقق من الرابط عند فتح الصفحة ---
    checkHashOnLoad();
  })
  .catch(err => console.error('فشل تحميل topics.json:', err));

const menuEl    = document.getElementById('menu');
const listEl    = document.getElementById('topics-list');
const contentEl = document.getElementById('content-area');

// 2) تحميل الموضوع واستدعاء الـpreload المتسلسل
function loadTopic(topic, clickedLi, updateHash = false) {
  currentTopic = topic;
  listEl.querySelectorAll('li').forEach(el => el.classList.remove('active'));
  
  if(clickedLi) {
      clickedLi.classList.add('active');
  }

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
      
      // تحديث الرابط والسجل
      if (updateHash) {
          window.location.hash = topic;
      }

      // اطلاق التحميل المتسلسل في الخلفية مع الجلسة
      preloadSequentialAudio(mySession).catch(console.error);
    });
}

// دالة جديدة للتحقق من الرابط عند الفتح
function checkHashOnLoad() {
    let currentHash = window.location.hash;
    if (currentHash) {
        let topicId = currentHash.replace('#', '');
        // البحث عن عنصر القائمة المطابق للـ id
        let targetLi = document.querySelector(`li[data-topic="${topicId}"]`);
        
        if (targetLi) {
             // فتح الموضوع بدون تغيير الـ hash مجدداً
            loadTopic(topicId, targetLi, false);
        }
    } else {
        // الحالة الابتدائية إذا لم يكن هناك هاش
        history.replaceState({ topic: null }, '', window.location.pathname);
    }
}

// 3) دعم زر الرجوع
window.addEventListener('popstate', e => {
    // إذا رجعنا إلى صفحة بدون هاش (القائمة الرئيسية)
    if (!window.location.hash) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
      contentEl.classList.add('hidden');
      menuEl.classList.remove('hidden');
      listEl.querySelectorAll('li').forEach(el => el.classList.remove('active'));
    } else {
      // إذا كان الرجوع لموضوع آخر (تغير الهاش)
      checkHashOnLoad();
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
  const elem     = document.querySelector(selector);
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

  // **** هنا نستخدم المسار المفتاحي بدل الاسم فقط ****
  const key = `${currentTopic}/${filename}`;
  if (audioCache[key]) {
    currentAudio = audioCache[key];
  } else {
    currentAudio = new Audio(key);
    audioCache[key] = currentAudio;
  }

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
    if (sessionToken !== preloadSessionToken) return;

    const onclick = icon.getAttribute('onclick') || '';
    const m = onclick.match(/playAudio\('(.+?)'\)/);
    if (!m) continue;
    const filename = m[1];

    const key = `${currentTopic}/${filename}`;
    if (!audioCache[key]) {
      const audio = new Audio(key);
      audio.preload = 'auto';
      await new Promise(resolve => {
        const onCan = () => {
          audio.removeEventListener('canplaythrough', onCan);
          resolve();
        };
        audio.addEventListener('canplaythrough', onCan);
        audio.load();
      });
      if (sessionToken !== preloadSessionToken) return;
      audioCache[key] = audio;
    }
  }
}
