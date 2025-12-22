document.addEventListener('DOMContentLoaded', () => {

    // --- Carousel Logic ---
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-btn.next');
    const prevButton = document.querySelector('.carousel-btn.prev');

    let currentIndex = 0;
    const slideIntervalTime = 5000; // 5 seconds

    const updateSlide = (index) => {
        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        // Add active class to current
        slides[index].classList.add('active');
    }

    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlide(currentIndex);
    }

    const prevSlide = () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlide(currentIndex);
    }

    // Event Listeners
    if (nextButton) nextButton.addEventListener('click', () => {
        nextSlide();
        resetTimer();
    });

    if (prevButton) prevButton.addEventListener('click', () => {
        prevSlide();
        resetTimer();
    });

    // Auto Play
    let slideInterval = setInterval(nextSlide, slideIntervalTime);

    const resetTimer = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, slideIntervalTime);
    }

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Whac-A-Mole Game Logic ---
    const modal = document.getElementById('game-modal');
    const startAdventureBtn = document.getElementById('start-adventure-btn');
    const closeGameBtn = document.getElementById('close-game-btn');

    // Buttons
    const difficultyButtons = document.querySelectorAll('.btn-difficulty');
    const titleRankingBtn = document.getElementById('title-ranking-btn');
    const registerBtn = document.getElementById('register-btn');
    const rankingTitleBtn = document.getElementById('ranking-title-btn');
    const rankingTabs = document.querySelectorAll('.tab-btn');

    // Scenes
    const scenes = {
        title: document.getElementById('game-title'),
        play: document.getElementById('game-play'),
        result: document.getElementById('game-result'),
        ranking: document.getElementById('game-ranking')
    };

    // Elements
    const moleGrid = document.getElementById('mole-grid');
    const scoreDisplay = document.getElementById('current-score');
    const timeDisplay = document.getElementById('time-remaining');
    const resultScoreDisplay = document.getElementById('result-score');
    const rankingList = document.getElementById('ranking-list');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const playerNameInput = document.getElementById('player-name');

    const currentDiffDisplay = document.getElementById('current-diff-display');
    const resultDiffLabel = document.getElementById('result-diff-label');
    const rankingTitleSuffix = document.getElementById('ranking-title-suffix');

    let score = 0;
    let timeLeft = 30;
    let gameTimer;
    let peepTimer;
    let countdownTimer;
    let isPlaying = false;
    let isSequencing = false;
    let lastHole;
    let currentDifficulty = 'normal';
    let currentRankingTab = 'normal';

    // Golden Time State
    let currentCombo = 0;
    let isGoldenTime = false;
    let goldenTimer;

    // Difficulty Config
    const DIFFICULTY = {
        easy: { label: '簡単', min: 800, max: 1500, goldChance: 0.3 },
        normal: { label: '普通', min: 400, max: 1000, goldChance: 0.2 },
        hard: { label: '難しい', min: 300, max: 800, goldChance: 0.15 },
        demon: { label: '鬼', min: 150, max: 400, goldChance: 0.1 }
    };

    // --- Audio System ---
    const sounds = {
        menu: new Audio('assets/sounds/menu.mp3'),
        bgm: new Audio('assets/sounds/bgm.mp3'),
        hit: new Audio('assets/sounds/hit.mp3'),
        goldHit: new Audio('assets/sounds/gold_hit.mp3'),
        spawn: new Audio('assets/sounds/spawn.mp3'),
        count: new Audio('assets/sounds/count.mp3'),
        finish: new Audio('assets/sounds/finish.mp3'),
        button: new Audio('assets/sounds/button.mp3'),
    };

    // Config
    sounds.bgm.loop = true;
    sounds.bgm.volume = 0.5;
    sounds.menu.loop = true;
    sounds.menu.volume = 0.5;

    const playSound = (name) => {
        const sound = sounds[name];
        if (sound) {
            if (name === 'bgm' || name === 'menu') {
                if (sound.paused) sound.play().catch(() => { });
            } else {
                sound.currentTime = 0;
                sound.play().catch(() => { });
            }
        }
    };

    const stopAllSounds = () => {
        sounds.bgm.pause();
        sounds.bgm.currentTime = 0;
        sounds.menu.pause();
        sounds.menu.currentTime = 0;
        sounds.finish.pause();
        sounds.finish.currentTime = 0;
    };

    const closeAll = () => {
        stopGame();
        isSequencing = false;
        clearTimeout(countdownTimer);
        stopAllSounds();
        modal.classList.add('hidden');
    };

    if (startAdventureBtn) {
        startAdventureBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            switchScene('title');
        });
    }

    if (closeGameBtn) closeGameBtn.addEventListener('click', closeAll);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAll();
    });

    const switchScene = (sceneName) => {
        Object.values(scenes).forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        const target = scenes[sceneName];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        if (sceneName === 'title' || sceneName === 'ranking') {
            playSound('menu');
        } else if (sceneName === 'play') {
            if (sounds.menu) {
                sounds.menu.pause();
                sounds.menu.currentTime = 0;
            }
        }
    };

    const startGoldenTime = () => {
        if (isGoldenTime) return;
        isGoldenTime = true;
        currentCombo = 0;
        scenes.play.classList.add('golden-mode');
        // Play distinct sound (using finish for now as placeholder or maybe rapidly spawn audio)
        playSound('goldHit');
        playSound('goldHit');

        // Duration 10s
        goldenTimer = setTimeout(endGoldenTime, 10000);
    };

    const endGoldenTime = () => {
        isGoldenTime = false;
        currentCombo = 0;
        scenes.play.classList.remove('golden-mode');
        clearTimeout(goldenTimer);
    };

    const initGrid = () => {
        moleGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.classList.add('hole');
            hole.dataset.id = i;
            const mole = document.createElement('div');
            mole.classList.add('mole');
            const face = document.createElement('div');
            face.classList.add('mole-face');
            const nose = document.createElement('div');
            nose.classList.add('mole-nose');
            face.appendChild(nose);
            mole.appendChild(face);
            hole.appendChild(mole);
            moleGrid.appendChild(hole);

            mole.addEventListener('click', (e) => {
                if (!e.isTrusted) return;
                if (hole.classList.contains('up')) {
                    const isGold = mole.classList.contains('gold');
                    const points = isGold ? 50 : 10;
                    score += points;
                    scoreDisplay.textContent = score;
                    playSound(isGold ? 'goldHit' : 'hit');
                    spawnHitEffect(e.pageX, e.pageY, points);
                    hole.classList.remove('up');
                    mole.classList.remove('gold');

                    // Combo Logic
                    if (!isGoldenTime) {
                        currentCombo++;
                        if (currentCombo >= 10) {
                            startGoldenTime();
                        }
                    }
                }
            });
        }
    };
    initGrid();

    const spawnHitEffect = (x, y, amount) => {
        const el = document.createElement('div');
        el.classList.add('hit-effect');
        el.textContent = `+${amount}`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }

    const randomTime = (min, max) => Math.round(Math.random() * (max - min) + min);
    const randomHole = (holes) => {
        const idx = Math.floor(Math.random() * holes.length);
        const hole = holes[idx];
        if (hole === lastHole) return randomHole(holes);
        lastHole = hole;
        return hole;
    }

    // --- Game Logic ---
    const peep = () => {
        const holes = document.querySelectorAll('.hole');
        const config = DIFFICULTY[currentDifficulty];

        // Speed up slightly during golden time? Or keep same? Keeping same for now but all gold.
        const time = randomTime(config.min, config.max);
        const hole = randomHole(holes);
        const mole = hole.querySelector('.mole');

        // Force Gold if Golden Time
        let isGold = isGoldenTime ? true : (Math.random() < config.goldChance);

        if (isGold) mole.classList.add('gold');
        else mole.classList.remove('gold');

        hole.classList.add('up');
        peepTimer = setTimeout(() => {
            hole.classList.remove('up');
            if (isPlaying) peep();
        }, isGold ? time * 0.6 : time);
    }

    const startSequence = (diff) => {
        currentDifficulty = diff;
        isSequencing = true;
        switchScene('play');

        currentDiffDisplay.textContent = DIFFICULTY[diff].label;
        countdownOverlay.classList.remove('hidden');
        countdownOverlay.textContent = '3';

        // Reset styles
        countdownOverlay.style.display = 'block';
        countdownOverlay.style.opacity = '1';

        let count = 3;

        const countStep = () => {
            if (!isSequencing) return; // Abort if closed

            if (count > 0) {
                countdownOverlay.textContent = count;
                countdownOverlay.style.animation = 'none';
                countdownOverlay.offsetHeight;
                countdownOverlay.style.animation = 'countPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

                // Play sound only at start (3)
                if (count === 3) playSound('count');

                count--;
                countdownTimer = setTimeout(countStep, 1000);
            } else {
                countdownOverlay.textContent = 'GO!';
                // Sound already playing from start
                countdownTimer = setTimeout(() => {
                    if (!isSequencing) return;
                    countdownOverlay.classList.add('hidden');
                    isSequencing = false;
                    startGame();
                }, 500);
            }
        };
        countStep();
    }

    const startGame = () => {
        score = 0;
        timeLeft = 30;
        scoreDisplay.textContent = 0;
        timeDisplay.textContent = 30;

        // Reset Combo
        currentCombo = 0;
        isGoldenTime = false;
        scenes.play.classList.remove('golden-mode');

        isPlaying = true;

        playSound('bgm');
        peep();

        gameTimer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                stopGame();
                showFinish(); // Show FINISH instead of results immediately
            }
        }, 1000);
    };

    const showFinish = () => {
        countdownOverlay.textContent = 'FINISH!';
        countdownOverlay.classList.remove('hidden');
        countdownOverlay.style.display = 'block';
        countdownOverlay.style.opacity = '1';
        playSound('finish');

        setTimeout(() => {
            countdownOverlay.classList.add('hidden');
            showResultInput();
        }, 1500);
    };

    const stopGame = () => {
        isPlaying = false;
        isSequencing = false;

        // Clear Golden Time
        clearTimeout(goldenTimer);
        isGoldenTime = false;
        scenes.play.classList.remove('golden-mode');

        clearInterval(gameTimer);
        clearTimeout(peepTimer);
        const holes = document.querySelectorAll('.hole');
        holes.forEach(h => h.classList.remove('up'));
        stopAllSounds();
    };

    // --- Ranking Logic ---
    const getRankingKey = (diff) => `moleRanking_${diff}`;

    const loadRanking = (diff) => {
        try {
            const data = localStorage.getItem(getRankingKey(diff));
            return JSON.parse(data) || [];
        } catch (e) { return []; }
    };

    const showResultInput = () => {
        switchScene('result');
        resultScoreDisplay.textContent = score;
        resultDiffLabel.textContent = `(${DIFFICULTY[currentDifficulty].label})`;
        playerNameInput.value = '';
    };

    const registerScore = () => {
        const name = playerNameInput.value.trim() || '名無し';
        let ranking = loadRanking(currentDifficulty);
        ranking.push({ name, score });
        ranking.sort((a, b) => b.score - a.score);
        ranking = ranking.slice(0, 5);
        localStorage.setItem(getRankingKey(currentDifficulty), JSON.stringify(ranking));

        currentRankingTab = currentDifficulty; // Auto switch to current played diff
        openRankingScene();
    };

    const openRankingScene = () => {
        updateRankingView(currentRankingTab);
        switchScene('ranking');
    }

    const updateRankingView = (diff) => {
        // Update Tabs
        rankingTabs.forEach(btn => {
            if (btn.dataset.tab === diff) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update Title
        rankingTitleSuffix.textContent = `(${DIFFICULTY[diff].label})`;

        // Update List
        const ranking = loadRanking(diff);
        rankingList.innerHTML = ranking.map((r, i) => `
            <li>
                <span>Rank ${i + 1} (${r.name})</span>
                <span>${r.score} pts</span>
            </li>
        `).join('');

        if (ranking.length === 0) {
            rankingList.innerHTML = '<li style="justify-content:center;">データなし</li>';
        }
    }

    // --- Events ---
    // Add button sound to all buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => playSound('button'));
    });

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            startSequence(btn.dataset.diff);
        });
    });

    rankingTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            currentRankingTab = btn.dataset.tab;
            updateRankingView(currentRankingTab);
        });
    });

    if (titleRankingBtn) {
        titleRankingBtn.addEventListener('click', () => {
            currentRankingTab = 'normal'; // Default view
            openRankingScene();
        });
    }

    if (registerBtn) registerBtn.addEventListener('click', registerScore);

    // Fixed: Removed missing rankingRetryBtn listener
    if (rankingTitleBtn) rankingTitleBtn.addEventListener('click', () => switchScene('title'));

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerScore();
    });

    console.log('Mole Smashers: Ready for Adventure!');
});
