// script.js

// أصوات النجاح/الخطأ
const correctSound = new Audio('Correct.wav');
const wrongSound   = new Audio('Wrong.wav');
correctSound.load();
wrongSound.load();

// عناصر DOM
const titleEl     = document.getElementById('quiz-title');
const videoScreen = document.getElementById('video-screen');
const quizScreen  = document.getElementById('quiz-screen');
const startBtn    = document.getElementById('start-btn');
const timeEl      = document.getElementById('time');
const answerEl    = document.getElementById('answer');
const wordsEl     = document.getElementById('words');
const resultEl    = document.getElementById('result');
const checkBtn    = document.getElementById('check-btn');
const nextBtn     = document.getElementById('next-btn');
const scoreEl     = document.getElementById('score');
const footerText  = document.getElementById('footer-text');

// استخراج اسم الاختبار من الرابط (test1 أو test2)
const params   = new URLSearchParams(window.location.search);
const testName = params.get('test') || 'test1';

let times = [];

// جلب بيانات الاختبار
fetch(`tests/${testName}.html`)
  .then(res => res.ok ? res.text() : Promise.reject())
  .then(html => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    titleEl.textContent = tmp.querySelector('h1').textContent;
    times = JSON.parse(tmp.querySelector('#test-data').textContent);
    startBtn.disabled = false;
  })
  .catch(() => {
    alert('تعذر تحميل الاختبار: ' + testName);
    startBtn.disabled = true;
  });

// عند الضغط على "بدأ الاختبار"
startBtn.addEventListener('click', () => {
  // إيقاف الفيديو
  const iframe = videoScreen.querySelector('iframe');
  iframe.src = '';
  videoScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  initQuiz();
});

function initQuiz() {
  let used = new Set(), score = 0, currentIdx, selectedWords = [];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickQuestion() {
    if (used.size === times.length) return null;
    let i;
    do { i = Math.floor(Math.random() * times.length); }
    while (used.has(i));
    used.add(i);
    return i;
  }

  function showQuestion() {
    currentIdx = pickQuestion();
    if (currentIdx === null) {
      // نهاية الاختبار
      timeEl.textContent    = '';
      wordsEl.innerHTML     = '';
      answerEl.style.display = 'none';
      checkBtn.classList.add('hidden');
      nextBtn.classList.add('hidden');
      resultEl.textContent  = '';
      scoreEl.textContent   = `الدرجة ${score}`;
      scoreEl.classList.remove('hidden');
      footerText.style.display = 'block';
      return;
    }
    const q = times[currentIdx];
    // عرض السؤال كنص أو وقت
    if (q.question) {
      timeEl.innerHTML = q.question;
    } else {
      timeEl.textContent = `${String(q.hour).padStart(2,'0')}:${String(q.minute).padStart(2,'0')}`;
    }
    // تهيئة الواجهة
    selectedWords = [];
    answerEl.style.display = '';
    answerEl.textContent   = '';
    resultEl.textContent   = '';
    wordsEl.innerHTML       = '';
    checkBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');
    scoreEl.classList.add('hidden');
    footerText.style.display = 'none';

    shuffle([...q.words]).forEach(word => {
      const span = document.createElement('span');
      span.textContent = word;
      span.className   = 'word';
      span.onclick = () => {
        if (span.classList.toggle('selected')) selectedWords.push(word);
        else selectedWords = selectedWords.filter(w => w !== word);
        answerEl.textContent = selectedWords.join(' ');
      };
      wordsEl.append(span);
    });
  }

  answerEl.onclick = () => {
    document.querySelectorAll('.word.selected').forEach(s => s.classList.remove('selected'));
    selectedWords = [];
    answerEl.textContent = '';
  };

  checkBtn.onclick = () => {
    const q   = times[currentIdx];
    const ans = answerEl.textContent.trim();
    if (ans === q.correct) {
      correctSound.play();
      resultEl.className   = 'result correct';
      resultEl.textContent = 'إجابتك صحيحة! أحسنت.';
      score += 2;
      celebrate();
    } else {
      wrongSound.play();
      resultEl.className   = 'result incorrect';
      resultEl.innerHTML   = `إجابتك خاطئة. الإجابة الصحيحة هي<br>${q.correct}`;
    }
    checkBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
  };

  nextBtn.onclick = () => {
    resultEl.textContent  = '';
    answerEl.textContent  = '';
    selectedWords = [];
    document.querySelectorAll('.word.selected').forEach(s => s.classList.remove('selected'));
    showQuestion();
  };

  showQuestion();
}

// دالة الاحتفال (confetti)
function celebrate() {
  const colors = ['#e91e63','#ffeb3b','#4caf50','#2196f3','#ff9800','#9c27b0'];
  const count  = 50;
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'confetti';
    const bg = colors[Math.floor(Math.random() * colors.length)];
    div.style.setProperty('--bg', bg);
    div.style.setProperty('--o', String(0.7 + Math.random()*0.3));
    div.style.setProperty('--w',  `${6 + Math.random()*6}px`);
    div.style.setProperty('--h',  `${4 + Math.random()*8}px`);
    div.style.setProperty('--dx', `${Math.random()*100-50}vw`);
    div.style.setProperty('--dy', `${window.innerHeight + 200}px`);
    div.style.setProperty('--r',  Math.random()*720);
    div.style.setProperty('--dur', `${3+Math.random()*2}s`);
    div.style.animationDelay = `${Math.random()*2}s`;
    div.style.top  = '-10px';
    div.style.left = `${Math.random()*window.innerWidth}px`;
    document.body.append(div);
    div.addEventListener('animationend', () => div.remove());
  }
}  