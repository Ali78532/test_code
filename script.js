const correctSoundEl = document.getElementById('correct-sound');
const wrongSoundEl   = document.getElementById('wrong-sound');
correctSoundEl.load();
wrongSoundEl.load();

const params   = new URLSearchParams(location.search);
const testName = params.get('test') || 'test1';

const titleEl     = document.getElementById('quiz-title');
const containerEl = document.getElementById('quiz-container');
const resultBox   = document.getElementById('result-box');
const scoreEl     = document.getElementById('score');

function celebrate() {
  const colors = ['#e91e63', '#ffeb3b', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'];
  const count = 120;

  for (let i = 0; i < count; i++) {
    const sq = document.createElement('div');
    sq.classList.add('confetti');

    const bg = colors[Math.floor(Math.random() * colors.length)];
    sq.style.setProperty('--bg', bg);
    sq.style.setProperty('--o', (0.7 + Math.random() * 0.3));

    const w = 6 + Math.random() * 6;
    const h = 4 + Math.random() * 8;
    sq.style.setProperty('--w', w + 'px');
    sq.style.setProperty('--h', h + 'px');
    if (Math.random() < 0.2) sq.style.setProperty('--round', '50%');

    const dx = (Math.random() * 100 - 50) + 'vw';
    sq.style.setProperty('--dy', window.innerHeight + 200 + 'px');
    sq.style.setProperty('--dx', dx);
    sq.style.setProperty('--r', Math.random() * 720);
    
    // ✅ تعديل المدة لتكون أبطأ وأكثر سلاسة
    const dur = (3 + Math.random() * 2) + 's';
    sq.style.setProperty('--dur', dur);

    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0:
        sq.style.top = '-10px';
        sq.style.left = Math.random() * window.innerWidth + 'px';
        break;
      case 1:
        sq.style.top = Math.random() * window.innerHeight + 'px';
        sq.style.left = '-10px';
        break;
      case 2:
        sq.style.top = Math.random() * window.innerHeight + 'px';
        sq.style.left = window.innerWidth + 'px';
        break;
      case 3:
        sq.style.top = window.innerHeight + 'px';
        sq.style.left = Math.random() * window.innerWidth + 'px';
        break;
    }

    document.body.appendChild(sq);
    sq.addEventListener('animationend', () => sq.remove());
  }
}

fetch(`tests/${testName}.html`)
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  })
  .then(html => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const h1 = temp.querySelector('h1');
    if (h1) {
      titleEl.textContent = h1.textContent;
      document.title = h1.textContent;
      h1.remove();
    }
    containerEl.innerHTML = temp.innerHTML;
    initQuiz();
  })
  .catch(err => {
    console.error('فشل تحميل الاختبار:', err);
    containerEl.innerHTML = '<p>عذرًا، لم أتمكن من تحميل هذا الاختبار.</p>';
  });

function initQuiz() {
  let score = 0;
  let answered = 0;
  const options = containerEl.querySelectorAll('.option');

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const parent = opt.parentElement;
      if (parent.querySelector('.selected')) return;

      const isCorrect = opt.dataset.correct === 'true';
      if (isCorrect) {
        correctSoundEl.currentTime = 0;
        correctSoundEl.play();
        opt.classList.add('correct');
        score += 2;
        celebrate();
      } else {
        wrongSoundEl.currentTime = 0;
        wrongSoundEl.play();
        if (navigator.vibrate) navigator.vibrate(80);
        opt.classList.add('wrong');
        const hint = parent.querySelector('.hint');
        if (hint) hint.style.display = 'block';
      }

      parent.querySelectorAll('.option').forEach(o => {
        if (o.dataset.correct === 'true') o.classList.add('correct');
      });

      opt.classList.add('selected');
      answered++;
      scoreEl.textContent = score;

      if (answered === containerEl.querySelectorAll('.question-container').length) {
        resultBox.style.display = 'block';
        showSolutionToggle();
      }
    });
  });
}

function showSolutionToggle() {
  let toggleDiv = document.getElementById('solution-toggle');
  if (!toggleDiv) {
    toggleDiv = document.createElement('div');
    toggleDiv.id = 'solution-toggle';
    toggleDiv.innerHTML = `
      <button id="hide-btn" class="toggle-btn">إخفاء الحل</button>
      <p class="toggle-msg">إذا كنت ترغب بأخذ لقطة شاشة يرجى إخفاء الحل لكي لا يظهر الحل لباقي الطلاب</p>
      <button id="show-btn" class="toggle-btn" style="display:none;">عرض الحل</button>
    `;
    resultBox.insertAdjacentElement('afterend', toggleDiv);

    const hideBtn = toggleDiv.querySelector('#hide-btn');
    const showBtn = toggleDiv.querySelector('#show-btn');
    const msg = toggleDiv.querySelector('.toggle-msg');

    hideBtn.addEventListener('click', () => {
      containerEl.style.display = 'none';
      resultBox.style.display = 'block';
      hideBtn.style.display = 'none';
      msg.style.display = 'none';
      showBtn.style.display = 'inline-block';
      document.body.classList.add('solutions-hidden');
    });

    showBtn.addEventListener('click', () => {
      containerEl.style.display = 'block';
      hideBtn.style.display = 'inline-block';
      msg.style.display = 'block';
      showBtn.style.display = 'none';
      document.body.classList.remove('solutions-hidden');
    });
  }
  toggleDiv.style.display = 'block';
}
