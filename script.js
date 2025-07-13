// script.js
let correctAnswers = [];
let times = [];
let words = [];
let resultsShown = false;

const videoScreen = document.getElementById('video-screen');
const quizScreen  = document.getElementById('quiz-screen');
const startBtn    = document.getElementById('start-btn');
const choicesEl   = document.getElementById('choices');
const questionsEl = document.getElementById('questions');
const resultButton= document.getElementById('result-button');
const resultEl    = document.getElementById('result');
const toggleContainer = document.getElementById('toggle-container');

const params   = new URLSearchParams(window.location.search);
const testName = params.get('test') || 'test1';

// Fetch test data
fetch(`tests/${testName}.html`)
  .then(r => r.ok ? r.text() : Promise.reject())
  .then(html => {
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const data = JSON.parse(tmp.querySelector('#test-data').textContent);
    words = data.words;
    times = data.questions;
    correctAnswers = times.map(q => q.correct);
  })
  .catch(() => alert('تعذّر تحميل الاختبار'));

function shuffleArray(arr){
  for(let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
}

startBtn.onclick = () => {
  videoScreen.querySelector('iframe').src = '';
  videoScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  renderQuiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderQuiz(){
  resultsShown = false;
  resultButton.style.display = 'none';
  toggleContainer.innerHTML = '';
  resultEl.textContent = '';
  choicesEl.innerHTML = '';
  questionsEl.innerHTML = '';

  // shuffle words
  const shuffled = [...words]; shuffleArray(shuffled);
  shuffled.forEach(w => {
    const btn = document.createElement('div'); btn.className='choice'; btn.textContent=w;
    btn.onclick = () => fillBlank(w);
    choicesEl.appendChild(btn);
  });

  // render questions
  times.forEach((q,i) => {
    const qc = document.createElement('div'); qc.className='question-container';
    qc.innerHTML = q.question.replace(/_/g,'<span class="blank"></span>');
    questionsEl.appendChild(qc);
  });
}

function fillBlank(word){ if(resultsShown) return; const blank = document.querySelector('.blank:not(.filled)'); if(!blank) return;
  blank.textContent = word; blank.classList.add('filled'); blank.onclick = () => removeWord(blank);
  checkCompletion();
}

function removeWord(blank){ if(resultsShown) return; blank.textContent=''; blank.classList.remove('filled'); checkCompletion(); }

function checkCompletion(){
  const all = [...document.querySelectorAll('.blank')].every(b=>b.textContent.trim()!=='');
  resultButton.style.display = all?'block':'none';
}

function showResult(){
  resultsShown = true;
  resultButton.style.display = 'none';
  let score = 0;
  document.querySelectorAll('.blank').forEach((b,i)=>{
    if(b.textContent===correctAnswers[i]){ b.classList.add('correct'); score+=2;
      const ok=document.createElement('div'); ok.className='user-correct'; ok.textContent='إجابتك صحيحة'; b.parentElement.append(ok);
    } else {
      b.classList.add('incorrect');
      const ko=document.createElement('div'); ko.className='correct-answer'; ko.textContent=`الإجابة الصحيحة: ${correctAnswers[i]}`; b.parentElement.append(ko);
    }
  });
  resultEl.textContent = `درجتك: ${score}`;
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  // add toggle buttons
  const hideBtn = document.createElement('button'); hideBtn.className='toggle-btn'; hideBtn.textContent='إخفاء الحل';
  const showBtn = document.createElement('button'); showBtn.className='toggle-btn'; showBtn.textContent='عرض الحل'; showBtn.style.display='none';
  hideBtn.onclick = () => {
    document.querySelectorAll('.question-container').forEach(el=>el.style.display='none');
    document.getElementById('choices').style.display = 'none';
	hideBtn.style.display='none'; showBtn.style.display='inline-block';
  };
  showBtn.onclick = () => {
    document.querySelectorAll('.question-container').forEach(el=>el.style.display='block');
    document.getElementById('choices').style.display = 'flex';
    showBtn.style.display='none'; hideBtn.style.display='inline-block';
  };
  toggleContainer.appendChild(hideBtn);
  toggleContainer.appendChild(showBtn);
}