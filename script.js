// project-root/script.js

let currentAudio = null;
let currentTopic = '';

// ضَع الحالة الابتدائية بدون topic
history.replaceState({ topic: null }, '', '');

const menuEl    = document.getElementById('menu');
const listEl    = document.getElementById('topics-list');
const contentEl = document.getElementById('content-area');

// بناء قائمة المواضيع
fetch('topics.json')
  .then(res => res.json())
  .then(topics => {
    topics.forEach(topic => {
      const li = document.createElement('li');
      li.textContent = topic.title;
      li.dataset.topic = topic.id;
      li.addEventListener('click', () => loadTopic(topic.id, li));
      listEl.appendChild(li);
    });
  })
  .catch(err => console.error('فشل تحميل topics.json:', err));

// تحميل الموضوع ـــ️ هنا نستخدم pushState
function loadTopic(topic, clickedLi) {
  currentTopic = topic;
  document.querySelectorAll('.topics-list li').forEach(el => el.classList.remove('active'));
  clickedLi.classList.add('active');

  fetch(`${topic}/content.html`)
    .then(res => res.text())
    .then(html => {
      contentEl.innerHTML = html;
      menuEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      // نضيف سجل جديد إلى التاريخ
      history.pushState({ topic }, '', '');
    });
}

// دعم زر الرجوع للتراجع خطوة واحدة وإيقاف الصوت
window.addEventListener('popstate', e => {
  const state = e.state;
  // إذا كانت الحالة بدون topic أو topic = null، نعود للشاشة الرئيسية
  if (!state || state.topic === null) {
    // إيقاف الصوت الحالي
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    contentEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    document.querySelectorAll('.topics-list li').forEach(el => el.classList.remove('active'));
  }
});

// تشغيل الصوت من نفس مجلد الموضوع
function playAudio(filename) {
  // إيقاف أي صوت سابق
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const src = `${currentTopic}/${filename}`;
  currentAudio = new Audio(src);
  currentAudio.play().catch(err => console.error('خطأ تشغيل الصوت:', err));
}
