let songs = [];

let index = 0;
let isPlaying = false;

/* --- ELEMENTOS --- */
const audio = document.getElementById('audio');
const cover = document.getElementById('cover');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const thumb = document.getElementById('thumb');

const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');

/* --- FUNÇÕES --- */
async function loadSong(i) {
  const song = songs[i];

  // Fade out
  cover.classList.add('opacity-0');
  title.classList.add('opacity-0');
  artist.classList.add('opacity-0');

  audio.pause();
  audio.currentTime = 0;

  return new Promise((resolve) => {
    setTimeout(() => {
      // troca conteúdo
      title.textContent = song.title;
      artist.textContent = song.artist;
      cover.src = song.cover;

      // troca o áudio
      audio.src = song.src;
      audio.load();

      audio.addEventListener(
        'loadedmetadata',
        () => {
          // Fade in
          cover.classList.remove('opacity-0');
          title.classList.remove('opacity-0');
          artist.classList.remove('opacity-0');

          resolve();
        },
        { once: true }
      );
    }, 150); // leve delay pra transição ficar suave
  });
}

function playSong() {
  audio.play();
  isPlaying = true;
  playBtn.innerHTML = 'pause';
}

function pauseSong() {
  audio.pause();
  isPlaying = false;
  playBtn.innerHTML = 'play_arrow';
}

playBtn.addEventListener('click', () => {
  isPlaying ? pauseSong() : playSong();
});

nextBtn.addEventListener('click', async () => {
  index = (index + 1) % songs.length;
  await loadSong(index);
  playSong();
});

prevBtn.addEventListener('click', async () => {
  index = (index - 1 + songs.length) % songs.length;
  await loadSong(index);
  playSong();
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  if (!isDragging) {
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.style.width = pct + '%';
    thumb.style.left = pct + '%';
  }
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('ended', async () => {
  index = (index + 1) % songs.length;
  await loadSong(index);
  playSong();
});

/* --- PROGRESSO ARRASTÁVEL --- */
let isDragging = false;

thumb.addEventListener('mousedown', () => (isDragging = true));
document.addEventListener('mouseup', () => (isDragging = false));
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const rect = progressContainer.getBoundingClientRect();
  let offset = e.clientX - rect.left;

  offset = Math.max(0, Math.min(offset, rect.width));
  const pct = (offset / rect.width) * 100;

  progress.style.width = pct + '%';
  thumb.style.left = pct + '%';

  audio.currentTime = (pct / 100) * audio.duration;
});

/* Clique direto na barra */
progressContainer.addEventListener('click', (e) => {
  const rect = progressContainer.getBoundingClientRect();
  const offset = e.clientX - rect.left;
  const pct = (offset / rect.width) * 100;

  progress.style.width = pct + '%';
  thumb.style.left = pct + '%';
  audio.currentTime = (pct / 100) * audio.duration;
});

function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

async function getTracksFromArtist(artistName) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    artistName
  )}&entity=song&limit=20`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('iTunes tracks:', data.results);
    return data.results;
  } catch (error) {
    console.error('Erro ao buscar músicas no iTunes:', error);
    return [];
  }
}

getTracksFromArtist('Billie Eilish').then(async (tracks) => {
  songs = tracks.map((t) => ({
    title: t.trackName,
    artist: t.artistName,
    cover: t.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg'),
    src: t.previewUrl,
  }));

  if (songs.length > 0) {
    loadSong(index);
  } else {
    title.textContent = 'Nenhuma música encontrada';
  }
});
