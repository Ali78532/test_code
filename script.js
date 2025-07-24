function pauseAll() {
  document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
}
const menuEl = document.getElementById('menu');
const contentEl = document.getElementById('content-area');
function loadTopic(topic, clickedLi) {
  document.querySelectorAll('.topics-list li').forEach(el => el.classList.remove('active'));
  clickedLi.classList.add('active');
  fetch(`${topic}/content.html`)
    .then(res => res.text())
    .then(html => {
      contentEl.innerHTML = html;
      menuEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
      history.pushState({topic}, '', '');
    });
}
document.querySelectorAll('.topics-list li').forEach(li => {
  li.addEventListener('click', () => loadTopic(li.dataset.topic, li));
});
window.addEventListener('popstate', e => {
  if (!e.state) {
    contentEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    document.querySelectorAll('.topics-list li').forEach(el => el.classList.remove('active'));
  }
});
function play(id) {
  pauseAll();
  const audio = document.getElementById(id);
  if (audio) audio.play();
}