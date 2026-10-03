(() => {
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-btn');
  const KEY = 'cow_music_on';
  let on = localStorage.getItem(KEY) !== '0';
  audio.volume = 0.5;

  function render() {
    btn.classList.toggle('off', !on);
  }

  function play() {
    if (!on) return;
    audio.play().catch(() => {
      // Autoplay blocked: start on first user interaction
      const resume = () => {
        if (on) audio.play().catch(() => {});
      };
      document.addEventListener('pointerdown', resume, { once: true });
    });
  }

  btn.addEventListener('click', () => {
    on = !on;
    localStorage.setItem(KEY, on ? '1' : '0');
    if (on) play(); else audio.pause();
    render();
  });

  render();
  play();
})();
