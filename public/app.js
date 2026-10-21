document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const nowPlaying = document.getElementById('now-playing');
    const playlistEl = document.getElementById('playlist');
    
    // Custom UI Elements
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const durationTimeEl = document.getElementById('duration-time');
    const volumeSlider = document.getElementById('volume-slider');
    const muteBtn = document.getElementById('mute-btn');
    const artContainer = document.getElementById('art-container');
    const eqContainer = document.getElementById('eq-container');

    let playlist = [];
    let currentIndex = 0;
    let isShuffle = false;
    let lastVolume = 1;
    let retryCount = 0;
    const MAX_RETRIES = 2;

    // Repeat Modes: 'off' | 'all' | '1'
    const repeatModes = ['off', 'all', '1'];
    let currentRepeatIndex = 0;

    // --- Disable Context Menu (Right-Click) ---
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // --- Theme Persistence Setup ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButtonText(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButtonText(newTheme);
    });

    function updateThemeButtonText(theme) {
        themeToggleBtn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }

    // --- Time Format Utility (Seconds -> MM:SS) ---
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds <= 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // --- Button State & UI Manager ---
    function updateNavButtons() {
        if (!Array.isArray(playlist) || playlist.length === 0) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        if (playlist.length === 1) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const mode = repeatModes[currentRepeatIndex];

        if (mode === 'all' || isShuffle) {
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        } else {
            prevBtn.disabled = (currentIndex === 0);
            nextBtn.disabled = (currentIndex === playlist.length - 1);
        }
    }

    function setVisualPlayingState(playing) {
        if (playing) {
            artContainer.classList.add('playing');
            eqContainer.classList.add('playing');
            playBtn.textContent = '⏸ Pause';
        } else {
            artContainer.classList.remove('playing');
            eqContainer.classList.remove('playing');
            playBtn.textContent = '▶ Play';
        }
    }

    // --- Repeat & Shuffle Toggles ---
    repeatBtn.addEventListener('click', () => {
        currentRepeatIndex = (currentRepeatIndex + 1) % repeatModes.length;
        const mode = repeatModes[currentRepeatIndex];
        
        if (mode === 'off') {
            repeatBtn.textContent = '🔁 Off';
            repeatBtn.classList.remove('active');
        } else if (mode === 'all') {
            repeatBtn.textContent = '🔁 All';
            repeatBtn.classList.add('active');
        } else if (mode === '1') {
            repeatBtn.textContent = '🔂 1';
            repeatBtn.classList.add('active');
        }
        updateNavButtons();
    });

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        updateNavButtons();
    });

    // --- Volume & Mute Handling ---
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value;
        muteBtn.textContent = audioPlayer.volume === 0 ? '🔇' : '🔊';
    });

    muteBtn.addEventListener('click', () => {
        if (audioPlayer.volume > 0) {
            lastVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            muteBtn.textContent = '🔇';
        } else {
            audioPlayer.volume = lastVolume || 1;
            volumeSlider.value = audioPlayer.volume;
            muteBtn.textContent = '🔊';
        }
    });

    // --- Seek / Progress Bar Handling ---
    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFill.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            durationTimeEl.textContent = formatTime(audioPlayer.duration);
        }
    });

    progressContainer.addEventListener('click', (e) => {
        if (!audioPlayer.duration) return;
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
    });

    // --- Playlist Fetching & Rendering ---
    async function fetchPlaylist() {
        try {
            const response = await fetch('/api/playlist');
            playlist = await response.json();
            renderPlaylist();
            updateNavButtons();
        } catch (error) {
            console.error('Failed to load playlist:', error);
            playlistEl.innerHTML = '<li>Error loading tracks from server.</li>';
            updateNavButtons();
        }
    }

    function renderPlaylist() {
        playlistEl.innerHTML = '';
        if (!Array.isArray(playlist) || playlist.length === 0) {
            playlistEl.innerHTML = '<li>No tracks found in cloud folder.</li>';
            return;
        }
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${track.title}`;
            li.id = `track-${index}`;
            li.addEventListener('click', () => {
                retryCount = 0;
                loadAndPlayTrack(index);
            });
            playlistEl.appendChild(li);
        });
    }

    function highlightCurrentTrack(index) {
        document.querySelectorAll('#playlist li').forEach(li => li.classList.remove('active'));
        const currentLi = document.getElementById(`track-${index}`);
        if (currentLi) {
            currentLi.classList.add('active');
            currentLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function loadAndPlayTrack(index) {
        if (index < 0 || index >= playlist.length) return;

        currentIndex = index;
        const track = playlist[currentIndex];

        audioPlayer.src = track.url;
        nowPlaying.textContent = `${track.title}`;
        highlightCurrentTrack(currentIndex);
        updateNavButtons();

        audioPlayer.play().then(() => {
            retryCount = 0;
            setVisualPlayingState(true);
        }).catch(err => {
            console.error("Playback execution error:", err);
            nowPlaying.textContent = `Error playing: ${track.title}`;
            setVisualPlayingState(false);
        });
    }

    // --- Mobile Stream Error Recovery ---
    audioPlayer.addEventListener('error', () => {
        console.warn('Audio stream interrupted or failed. Attempting recovery...');
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            nowPlaying.textContent = `Reconnecting stream (${retryCount}/${MAX_RETRIES})...`;
            setTimeout(() => {
                audioPlayer.load();
                audioPlayer.play().catch(e => console.error("Retry failed:", e));
            }, 1500);
        } else {
            nowPlaying.textContent = `Stream error on: ${playlist[currentIndex]?.title || 'Track'}`;
            setVisualPlayingState(false);
        }
    });

    function showAlert(title, text, icon = 'warning') {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const isDark = currentTheme === 'dark';

        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonText: 'Okay',
            confirmButtonColor: '#10b981',
            background: isDark ? '#18181c' : '#ffffff',
            color: isDark ? '#f4f4f5' : '#18181b'
        });
    }

    // Initial Load
    await fetchPlaylist();

    // --- Transport Control Listeners ---
    playBtn.addEventListener('click', async () => {
        if (!Array.isArray(playlist) || playlist.length === 0) {
            nowPlaying.textContent = 'Refreshing playlist...';
            await fetchPlaylist();
        }

        if (!Array.isArray(playlist) || playlist.length === 0) {
            nowPlaying.textContent = 'Status: Ready to Stream';
            showAlert('Playlist Empty', 'No tracks available to play from cloud folder yet.');
            return;
        }

        if (audioPlayer.paused) {
            if (!audioPlayer.src) {
                loadAndPlayTrack(0);
            } else {
                audioPlayer.play();
                setVisualPlayingState(true);
            }
        } else {
            audioPlayer.pause();
            setVisualPlayingState(false);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        retryCount = 0;

        if (isShuffle) {
            loadAndPlayTrack(Math.floor(Math.random() * playlist.length));
            return;
        }

        const mode = repeatModes[currentRepeatIndex];
        if (currentIndex > 0) {
            loadAndPlayTrack(currentIndex - 1);
        } else if (mode === 'all') {
            loadAndPlayTrack(playlist.length - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (playlist.length === 0) return;
        retryCount = 0;

        if (isShuffle) {
            loadAndPlayTrack(Math.floor(Math.random() * playlist.length));
            return;
        }

        const mode = repeatModes[currentRepeatIndex];
        if (currentIndex < playlist.length - 1) {
            loadAndPlayTrack(currentIndex + 1);
        } else if (mode === 'all') {
            loadAndPlayTrack(0);
        }
    });

    // Handle Auto-Advancing
    audioPlayer.addEventListener('ended', () => {
        const mode = repeatModes[currentRepeatIndex];
        retryCount = 0;

        if (mode === '1') {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else if (isShuffle) {
            loadAndPlayTrack(Math.floor(Math.random() * playlist.length));
        } else if (currentIndex < playlist.length - 1) {
            loadAndPlayTrack(currentIndex + 1);
        } else if (mode === 'all') {
            loadAndPlayTrack(0);
        } else {
            setVisualPlayingState(false);
            nowPlaying.textContent = 'Playback finished!';
            updateNavButtons();
        }
    });
});