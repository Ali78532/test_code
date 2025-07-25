// project-root/script.js

let currentAudio = null;
let currentTopic = '';

// الحالة الابتدائية
history.replaceState({ topic: null }, '', '');

const menuEl    = document.getElementById('menu');
const listEl    = document.getElementById('topics-list');
const contentEl = document.getElementById('content-area');

fetch('topics.json')
  .then(res => res.json())
  .then(topics => {
    let lastGroup = null;

    topics.forEach(topic => {
      const group = topic.group || 'عام';

      // إضافة الفاصل عند تغيّر المجموعة
      if (group !== lastGroup) {
        const sep = document.createElement('li');
        sep.className = 'separator';
        // هنا استخدمنا backticks لتضمين المتغيّر داخل السلسلة
        sep.textContent = `--------(${group})--------`;
        listEl.appendChild(sep);
        lastGroup = group;
      }

      // إضافة العنصر نفسه
      const li = document.createElement('li');
      li.textContent   = topic.title;
      li.dataset.topic = topic.id;
      li.addEventListener('click', () => loadTopic(topic.id, li));
      listEl.appendChild(li);
    });
  })
  .catch(err => console.error('فشل تحميل topics.json:', err));

function afterContentLoaded() {
  contentEl.querySelectorAll('.audio-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      // تأخير 500ms قبل إنشاء العنصر
      icon._loadingTimer = setTimeout(() => {
        // إذا لم يكن موجودًا مسبقًا
        if (!icon.parentNode.querySelector('.loading-text')) {
          const txt = document.createElement('span');
          txt.className = 'loading-text';
          txt.textContent = 'جاري التحميل…';
          icon.parentNode.appendChild(txt);
        }
      }, 500);
    });
  });
}


function loadTopic(topic, clickedLi) {
  currentTopic = topic;
  listEl.querySelectorAll('li').forEach(el => el.classList.remove('active'));
  clickedLi.classList.add('active');

  // استخدام backticks حول مسار الملف
  fetch(`${topic}/content.html`)
    .then(r => r.text())
    .then(html => {
      contentEl.innerHTML = html;
      window.scrollTo(0, 0);
      menuEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      history.pushState({ topic }, '', '');

      afterContentLoaded();
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
  // إيقاف أي صوت سابق
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(`${currentTopic}/${filename}`);

  currentAudio.addEventListener('canplaythrough', () => {
    document.querySelectorAll('.audio-icon').forEach(icon => {
      if (icon._loadingTimer) {
        clearTimeout(icon._loadingTimer);
        icon._loadingTimer = null;
      }
    });
      contentEl.querySelectorAll('.loading-text').forEach(el => el.remove());
      currentAudio.play().catch(console.error);
  });

  currentAudio.load();
}

