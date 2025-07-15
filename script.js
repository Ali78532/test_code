// script.js

const correctSoundEl = document.getElementById('correct-sound');
const wrongSoundEl   = document.getElementById('wrong-sound');
const videoScreen    = document.getElementById('video-screen');
const quizScreen     = document.getElementById('quiz-screen');
const startBtn       = document.getElementById('start-btn');
const leftList       = document.getElementById('left-list');
const rightList      = document.getElementById('right-list');
const connections    = document.getElementById('connections');
const scoreElement   = document.getElementById('score');
const toggleBtn      = document.getElementById('toggle-btn');

correctSoundEl.load();
wrongSoundEl.load();

let pairs = [];
let score = 0;
let selectedWord = null;
let solutionsHidden = false;
let linesData = [];

// خلط المصفوفة
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// رسم الخطوط فقط (دون زيادة الطول)
function drawOnly(a, b) {
  const r1   = a.getBoundingClientRect();
  const r2   = b.getBoundingClientRect();
  const line = document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1', r1.right + window.scrollX);
  line.setAttribute('y1', r1.top + r1.height/2 + window.scrollY);
  line.setAttribute('x2', r2.left + window.scrollX);
  line.setAttribute('y2', r2.top + r2.height/2 + window.scrollY);
  line.classList.add('line');
  connections.appendChild(line);
}

// إعادة رسم الخطوط عند تغيير الحجم
window.addEventListener('resize', () => {
  connections.innerHTML = '';
  linesData.forEach(d => drawOnly(d.a, d.b));
});

// زر 'بدأ الاختبار'
startBtn.addEventListener('click', () => {
  videoScreen.querySelector('iframe').src = '';
  videoScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  document.body.classList.remove('solutions-hidden');
  renderGame();
});

// جلب بيانات الاختبار
const params   = new URLSearchParams(window.location.search);
const testName = params.get('test') || 'test1';
fetch(`tests/${testName}.html`)
  .then(r => r.ok ? r.text() : Promise.reject())
  .then(html => {
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const data = JSON.parse(tmp.querySelector('#test-data').textContent);
    pairs = data.pairs;
    startBtn.disabled = false;
    // تهيئة زر الإخفاء/عرض الحل
    toggleBtn.addEventListener('click', () => {
      solutionsHidden = !solutionsHidden;
      document.body.classList.toggle('solutions-hidden', solutionsHidden);
      document.querySelectorAll('.word').forEach(w =>
        w.style.visibility = solutionsHidden ? 'hidden' : 'visible'
      );
      document.querySelectorAll('.line').forEach(l =>
        l.style.visibility = solutionsHidden ? 'hidden' : 'visible'
      );
      toggleBtn.textContent = solutionsHidden ? 'عرض الحل' : 'إخفاء الحل';
    });
  })
  .catch(err => console.error('فشل تحميل بيانات الاختبار:', err));

// تهيئة اللعبة
function renderGame() {
  leftList.innerHTML    = '';
  rightList.innerHTML   = '';
  connections.innerHTML = '';
  linesData = [];
  score = 0; scoreElement.textContent = score;
  toggleBtn.classList.add('hidden');
  selectedWord = null;

  const leftPairs  = [...pairs];
  const rightPairs = [...pairs];
  shuffle(leftPairs);
  shuffle(rightPairs);

  leftPairs.forEach(p => {
    const div = document.createElement('div');
    div.className   = 'word left-word';
    div.textContent = p.left;
    div.dataset.val = p.left;
    div.onclick     = () => selectLeft(div);
    leftList.appendChild(div);
  });

  rightPairs.forEach(p => {
    const div = document.createElement('div');
    div.className   = 'word right-word';
    div.textContent = p.right;
    div.dataset.val = p.right;
    div.onclick     = () => selectRight(div);
    rightList.appendChild(div);
  });
}

// اختيار كلمة من اليسار
function selectLeft(el) {
  if (
    el.classList.contains('matched-left') ||
    el.classList.contains('incorrect-left') ||
    el.classList.contains('disabled-left')
  ) return;
  if (selectedWord) selectedWord.classList.remove('selected');
  selectedWord = el; selectedWord.classList.add('selected');
}

// اختيار كلمة من اليمين
function selectRight(el) {
  if (!selectedWord) return;
  // ارسم الخط وسجّله
  drawOnly(selectedWord, el);
  linesData.push({ a:selectedWord, b:el });

  // منع إعادة اختيار اليسرى
  selectedWord.classList.add('disabled-left');

  const match = pairs.some(
    p => p.left === selectedWord.dataset.val && p.right === el.dataset.val
  );

  if (match) {
    correctSoundEl.play();
    selectedWord.classList.add('matched-left');
    score += 2;
  } else {
    wrongSoundEl.play();
    if (navigator.vibrate) navigator.vibrate(80);
    selectedWord.classList.add('incorrect-left');
  }

  scoreElement.textContent = score;
  selectedWord.classList.remove('selected');
  selectedWord = null;

  checkComplete();
}

// تحقق ما إذا أنفقِد الزوج الأيسر جميعَه
function checkComplete() {
  // عدّ كلمات اليسار المعطّلة (اختيرت)
  const doneCount = leftList.querySelectorAll('.disabled-left').length;
  if (doneCount === pairs.length) {
    toggleBtn.textContent = 'إخفاء الحل';
    toggleBtn.classList.remove('hidden');
	connections.innerHTML = '';
    linesData.forEach(d => drawOnly(d.a, d.b));
  }
}
