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
      // إذا لم يُحدّد topic.group، نعطيه قيمة افتراضية
      const group = topic.group || 'عام';

      // عندما تتغير المجموعة، نضيف فاصل
      if (group !== lastGroup) {
        const sep = document.createElement('li');
        sep.className = 'separator';
        sep.textContent = `ـــــــــــ( ${group} )ـــــــــــ`;
        listEl.appendChild(sep);
        lastGroup = group;
      }

      // ثم نضيف العنصر نفسه
      const li = document.createElement('li');
      li.textContent = topic.title;
      li.dataset.topic = topic.id;
      // **التصحيح هنا**: ربط الـcallback بشكل صحيح
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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(`${currentTopic}/${filename}`);
  currentAudio.play().catch(console.error);
}
