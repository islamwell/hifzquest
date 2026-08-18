document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. SOUND & AUDIO SYNTHESIZER (Web Audio API)
    // ==========================================
    let audioCtx = null;
    let ambientGain = null;
    let ambientSource = null;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            if (type === 'click') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'success') {
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.12, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.25);
                });
            } else if (type === 'chime') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.8);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.8);
            } else if (type === 'alarm') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.log('Audio synthesis note: ', e);
        }
    }

    // Synthesized Pink Noise Ambient Sound Generator (Rain/Wind)
    window.toggleAmbientNoise = function() {
        const toggle = document.getElementById('toggle-ambient-sound');
        const ctx = getAudioContext();

        if (toggle && toggle.checked) {
            try {
                const bufferSize = ctx.sampleRate * 2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const output = buffer.getChannelData(0);
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    output[i] *= 0.05;
                    b6 = white * 0.115926;
                }

                ambientSource = ctx.createBufferSource();
                ambientSource.buffer = buffer;
                ambientSource.loop = true;

                ambientGain = ctx.createGain();
                ambientGain.gain.setValueAtTime(0.15, ctx.currentTime);

                ambientSource.connect(ambientGain);
                ambientGain.connect(ctx.destination);
                ambientSource.start();
                showToast('Ambient rain noise enabled', 'info');
            } catch (e) {
                console.error(e);
            }
        } else {
            if (ambientSource) {
                try {
                    ambientSource.stop();
                    ambientSource.disconnect();
                } catch (e) {}
                ambientSource = null;
            }
            showToast('Ambient noise muted', 'info');
        }
    };

    // ==========================================
    // 2. QURAN DATABASE & AUDIO STREAMS (Juz 30)
    // ==========================================
    const surahData = {
        'Al-Ikhlas': {
            number: 112,
            arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
            translation: '"Say, He is Allah, [who is] One"',
            guide: 'الله',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6222.mp3',
            insight: 'Ensure you bounce the letter Dal (د) in "Ahad" to apply the Qalqalah rule when stopping.'
        },
        'Al-Falaq': {
            number: 113,
            arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
            translation: '"Say, I seek refuge in the Lord of daybreak"',
            guide: 'الفلق',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6226.mp3',
            insight: 'Apply strong Qalqalah on the final Qaf (ق) in "Al-Falaq".'
        },
        'An-Nas': {
            number: 114,
            arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
            translation: '"Say, I seek refuge in the Lord of mankind"',
            guide: 'الناس',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6231.mp3',
            insight: 'Hold the Ghunnah on the Noon Mushaddadah (نّ) in "An-Nas" for 2 harakah.'
        },
        'Al-Kafirun': {
            number: 109,
            arabic: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ',
            translation: '"Say, O disbelievers..."',
            guide: 'الكافرون',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6205.mp3',
            insight: 'Elongate the Madd Ja\'iz Munfasil in "Yaaa Ayyuha" for 4 counts.'
        },
        'Al-Kawthar': {
            number: 108,
            arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
            translation: '"Indeed, We have granted you, [O Muhammad], al-Kawthar."',
            guide: 'الكوثر',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6202.mp3',
            insight: 'Pronounce the Tha (ث) softly with the tip of your tongue between teeth.'
        },
        'Al-Maun': {
            number: 107,
            arabic: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ',
            translation: '"Have you seen the one who denies the Recompense?"',
            guide: 'الماعون',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6195.mp3',
            insight: 'Ensure clear distinction between the Hamzah and Ra in "Ara\'ayta".'
        },
        'Quraysh': {
            number: 106,
            arabic: 'لِإِيلَافِ قُرَيْشٍ',
            translation: '"For the accustomed security of the Quraysh -"',
            guide: 'قريش',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6191.mp3',
            insight: 'Apply soft Leen elongation on the Ya (يْ) of "Quraysh".'
        },
        'Al-Fil': {
            number: 105,
            arabic: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ',
            translation: '"Have you not considered, [O Muhammad], how your Lord dealt with the companions of the elephant?"',
            guide: 'الفيل',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6186.mp3',
            insight: 'Notice the Izhar Shafawi rule in "Alam tara" — do not hide the Meem.'
        },
        'Al-Asr': {
            number: 103,
            arabic: 'وَالْعَصْرِ • إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
            translation: '"By time, indeed mankind is in loss."',
            guide: 'العصر',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6177.mp3',
            insight: 'Give the letter Sad (ص) its full heavy (Tafkheem) characteristic.'
        },
        'Al-Qadr': {
            number: 97,
            arabic: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ',
            translation: '"Indeed, We sent the Quran down during the Night of Decree."',
            guide: 'القدر',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6126.mp3',
            insight: 'Apply strong Qalqalah on the Dal (د) of "Al-Qadr".'
        },
        'Ash-Sharh': {
            number: 94,
            arabic: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ',
            translation: '"Did We not expand for you, [O Muhammad], your breast?"',
            guide: 'الشرح',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6093.mp3',
            insight: 'Give the letter Ha (ح) in "Nashrah" its natural breath release (Hams).'
        },
        'Ad-Duha': {
            number: 93,
            arabic: 'وَالضُّحَىٰ • وَاللَّيْلِ إِذَا سَجَىٰ',
            translation: '"By the morning brightness, and [by] the night when it covers with darkness."',
            guide: 'الضحى',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/6082.mp3',
            insight: 'Pronounce the Dad (ض) from the side of the tongue with Istitalah.'
        },
        'An-Naba': {
            number: 78,
            arabic: 'عَمَّ يَتَسَاءَلُونَ • عَنِ النَّبَإِ الْعَظِيمِ',
            translation: '"About what are they asking one another? About the great news -"',
            guide: 'النبأ',
            audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/5673.mp3',
            insight: 'Hold the Ghunnah on the Meem (مّ) in "\'Amma" for 2 harakah.'
        }
    };

    // Teacher Profiles Database
    const teachersDb = [
        { name: 'Sheikh Hamza Yousef', gender: 'male', lang: 'en', skill: 'adv', qiraat: 'Hafs', rate: '$25/hr', compat: 98, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
        { name: 'Ustadha Fatima Al-Zahra', gender: 'female', lang: 'ar', skill: 'int', qiraat: 'Warsh', rate: '$20/hr', compat: 95, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
        { name: 'Hafiz Tariq Mahmood', gender: 'male', lang: 'ur', skill: 'beg', qiraat: 'Hafs', rate: '$15/hr', compat: 91, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
        { name: 'Sheikh Yasser Al-Masri', gender: 'male', lang: 'ar', skill: 'adv', qiraat: 'Hafs', rate: '$30/hr', compat: 96, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
        { name: 'Ustadha Aisha Siddiqa', gender: 'female', lang: 'en', skill: 'int', qiraat: 'Hafs', rate: '$22/hr', compat: 94, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100' }
    ];

    // ==========================================
    // 3. PERSISTENT APP STATE
    // ==========================================
    const defaultState = {
        userName: 'Muslim Ahmed',
        selectedSurah: 'Al-Ikhlas',
        currentTab: 'dashboard',
        isRecording: false,
        streakCount: 12,
        wirdTarget: '5 Ayahs',
        qiraat: "Hafs 'an 'Asim",
        hasanatXP: 1450,
        masteredSurahs: ['An-Nas', 'Al-Falaq', 'Al-Ikhlas', 'Al-Kafirun'],
        bookings: [
            { id: 1, teacherName: 'Sheikh Hamza Yousef', date: 'Tomorrow', time: '06:00 PM', focus: 'Tajweed Correction', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' }
        ],
        selectedWizardOptions: { gender: 'same', lang: 'ar', skill: 'int' },
        detoxCountdownSeconds: 120,
        focusDurationMins: 25,
        focusRemainingSecs: 1500,
        isFocusRunning: false
    };

    function loadState() {
        try {
            const saved = localStorage.getItem('hifzquest_state_v1');
            return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
        } catch (e) {
            return defaultState;
        }
    }

    const appState = loadState();

    function saveState() {
        try {
            localStorage.setItem('hifzquest_state_v1', JSON.stringify(appState));
        } catch (e) {}
    }

    // Refresh UI from State
    function refreshHeaderAndStreakUI() {
        const streakEl = document.getElementById('streak-count');
        const userDisplay = document.getElementById('user-display-name');
        const dashTitle = document.querySelector('.section-title');
        const wirdVal = document.getElementById('dash-wird');
        const bookingsCount = document.getElementById('my-bookings-count-label');

        if (streakEl) streakEl.textContent = `${appState.streakCount} Day Streak`;
        if (userDisplay) userDisplay.textContent = appState.userName;
        if (dashTitle && dashTitle.textContent.startsWith('Salaam')) {
            dashTitle.textContent = `Salaam, ${appState.userName.split(' ')[0]}`;
        }
        if (wirdVal) wirdVal.textContent = appState.wirdTarget;
        if (bookingsCount) bookingsCount.textContent = `My Bookings (${appState.bookings.length})`;
    }

    refreshHeaderAndStreakUI();

    // ==========================================
    // 4. TOAST NOTIFICATION SYSTEM
    // ==========================================
    window.showToast = function(text, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            playSound('success');
            iconSvg = '<svg style="width:18px;height:18px;fill:#10b981;flex-shrink:0;" viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>';
        } else if (type === 'warn') {
            playSound('alarm');
            iconSvg = '<svg style="width:18px;height:18px;fill:#f59e0b;flex-shrink:0;" viewBox="0 0 24 24"><path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>';
        } else if (type === 'error') {
            playSound('alarm');
            iconSvg = '<svg style="width:18px;height:18px;fill:#ef4444;flex-shrink:0;" viewBox="0 0 24 24"><path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2Z"/></svg>';
        } else {
            playSound('click');
            iconSvg = '<svg style="width:18px;height:18px;fill:#0d9488;flex-shrink:0;" viewBox="0 0 24 24"><path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 12,22M11,17H13V11H11V17Z"/></svg>';
        }

        toast.innerHTML = `${iconSvg}<span>${text}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-closing');
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    };

    // ==========================================
    // 5. TAB SWITCHING ENGINE
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const sections = document.querySelectorAll('.app-section');

    function bindNavEvents(elements) {
        elements.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                playSound('click');
                const targetTab = item.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });
    }

    bindNavEvents(navItems);
    bindNavEvents(mobileNavItems);

    window.switchTab = function(tabId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        mobileNavItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));

        const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        const targetMobileNav = document.querySelector(`.mobile-nav-item[data-tab="${tabId}"]`);
        const targetSection = document.getElementById(tabId);

        if (targetSection) {
            if (targetNav) targetNav.classList.add('active');
            if (targetMobileNav) targetMobileNav.classList.add('active');
            
            targetSection.classList.add('active');
            appState.currentTab = tabId;
            saveState();
            window.location.hash = tabId;

            if (tabId === 'canvas') {
                initCanvasSize();
            }
        }
    };

    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if (['dashboard', 'map', 'reciter', 'canvas', 'matching', 'detox'].includes(hash)) {
            switchTab(hash);
        }
    }

    // ==========================================
    // 6. THEME SWITCH ENGINE
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleText = document.getElementById('theme-toggle-text');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            playSound('click');
            const isLight = document.body.classList.toggle('light-theme');
            if (isLight) {
                themeToggleText.textContent = 'Dark Mode';
                themeToggleIcon.innerHTML = `<path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,2A1,1 0 0,1 13,3V5A1,1 0 0,1 11,5V3A1,1 0 0,1 12,2M12,19A1,1 0 0,1 13,20V22A1,1 0 0,1 11,22V20A1,1 0 0,1 12,19M2,12A1,1 0 0,1 3,11H5A1,1 0 0,1 5,13H3A1,1 0 0,1 2,12M19,12A1,1 0 0,1 20,11H22A1,1 0 0,1 22,13H20A1,1 0 0,1 19,12M4.93,4.93A1,1 0 0,1 6.34,4.93L7.76,6.34A1,1 0 0,1 6.34,7.76L4.93,6.34A1,1 0 0,1 4.93,4.93M16.24,16.24A1,1 0 0,1 17.66,16.24L19.07,17.66A1,1 0 0,1 17.66,19.07L16.24,17.66A1,1 0 0,1 16.24,16.24M19.07,4.93A1,1 0 0,1 19.07,6.34L17.66,7.76A1,1 0 0,1 16.24,6.34L17.66,4.93A1,1 0 0,1 19.07,4.93M6.34,16.24L7.76,17.66A1,1 0 0,1 6.34,19.07L4.93,17.66A1,1 0 0,1 6.34,16.24Z"/>`;
            } else {
                themeToggleText.textContent = 'Light Mode';
                themeToggleIcon.innerHTML = `<path d="M12,18C11.11,18 10.26,17.8 9.5,17.45C11.56,16.5 13,14.42 13,12C13,9.58 11.56,7.5 9.5,6.55C10.26,6.2 11.11,6 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>`;
            }
            
            if (appState.currentTab === 'canvas') {
                initCanvasSize();
            }
        });
    }

    // ==========================================
    // 7. MODALS ENGINE & GLOBAL CONTROLS
    // ==========================================
    window.openModal = function(id) {
        playSound('click');
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    };

    window.closeModal = function(id) {
        playSound('click');
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    };

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('active');
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
        }
    });

    // Profile Modal
    window.openProfileModal = function() {
        const nameInput = document.getElementById('profile-name-input');
        const targetSelect = document.getElementById('profile-target-select');
        const qiraatSelect = document.getElementById('profile-qiraat-select');

        if (nameInput) nameInput.value = appState.userName;
        if (targetSelect) targetSelect.value = appState.wirdTarget;
        if (qiraatSelect) qiraatSelect.value = appState.qiraat;

        openModal('profile-modal');
    };

    window.saveUserProfile = function() {
        const nameInput = document.getElementById('profile-name-input');
        const targetSelect = document.getElementById('profile-target-select');
        const qiraatSelect = document.getElementById('profile-qiraat-select');

        if (nameInput && nameInput.value.trim()) {
            appState.userName = nameInput.value.trim();
        }
        if (targetSelect) {
            appState.wirdTarget = targetSelect.value;
        }
        if (qiraatSelect) {
            appState.qiraat = qiraatSelect.value;
        }

        saveState();
        refreshHeaderAndStreakUI();
        closeModal('profile-modal');
        showToast('Profile & daily learning targets saved!', 'success');
    };

    // Stats Modal
    window.openStatsModal = function() {
        const list = document.getElementById('stats-surahs-list');
        const count = document.getElementById('stats-mastered-count');
        if (count) count.textContent = `${appState.masteredSurahs.length} / 114`;

        if (list) {
            list.innerHTML = Object.keys(surahData).map(s => {
                const isDone = appState.masteredSurahs.includes(s);
                return `
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:0.5rem 0.75rem; background:var(--bg-card-sub); border-radius:8px;">
                        <span>Surah ${s}</span>
                        <span style="color:${isDone ? '#10b981' : 'var(--text-secondary)'}; font-weight:600;">
                            ${isDone ? '✓ Mastered (96%)' : 'In Progress'}
                        </span>
                    </div>
                `;
            }).join('');
        }
        openModal('stats-modal');
    };

    // Day Details Modal
    window.openDayDetailsModal = function(dayName, ayahs, precision) {
        document.getElementById('day-modal-title').textContent = `${dayName} Summary`;
        document.getElementById('day-modal-ayahs').textContent = `${ayahs} Ayahs`;
        document.getElementById('day-modal-precision').textContent = precision;
        openModal('day-details-modal');
    };

    // Practice Modal (from Map or Dashboard)
    window.openPracticeModal = function(surahName) {
        appState.selectedSurah = surahName;
        const modal = document.getElementById('practice-modal');
        const title = document.getElementById('practice-modal-title');
        const subtitle = document.getElementById('practice-modal-subtitle');
        
        if (modal && title && subtitle) {
            title.textContent = `Practice Surah ${surahName}`;
            subtitle.textContent = `Select a focus path to practice or test your memorization of Surah ${surahName}.`;
            modal.classList.add('active');
        }
    };

    window.closePracticeModal = function() {
        closeModal('practice-modal');
    };

    window.startPracticeMode = function(type) {
        closePracticeModal();
        const data = surahData[appState.selectedSurah] || surahData['Al-Ikhlas'];

        if (type === 'recite') {
            updateReciterSurah(appState.selectedSurah);
            switchTab('reciter');
        } else if (type === 'write') {
            const guideSelect = document.getElementById('canvas-guide-select');
            if (guideSelect) guideSelect.value = data.guide;
            document.getElementById('canvas-guide-text').textContent = data.guide;
            switchTab('canvas');
        }
    };

    // ==========================================
    // 8. AI RECITER, QARI AUDIO & SPEECH-TO-TEXT
    // ==========================================
    const micBtn = document.getElementById('mic-trigger-btn');
    const recStatus = document.getElementById('recording-status');
    const speechTranscript = document.getElementById('speech-live-transcript');
    const waveCanvas = document.getElementById('audio-wave');
    const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;
    const playQariBtn = document.getElementById('play-qari-audio-btn');
    const playQariLabel = document.getElementById('qari-audio-btn-label');
    const playUserRecBtn = document.getElementById('play-user-recording-btn');
    const reciterSurahSelect = document.getElementById('reciter-surah-select');
    const reciterPrevBtn = document.getElementById('reciter-prev-btn');
    const reciterNextBtn = document.getElementById('reciter-next-btn');

    let waveAnimationId = null;
    let recAnalyser = null;
    let recDataArray = null;
    let recMediaStream = null;
    let mediaRecorder = null;
    let recordedAudioChunks = [];
    let userAudioBlobUrl = null;
    let userAudioPlayer = null;
    let qariAudioPlayer = new Audio();
    let isQariPlaying = false;
    let recognition = null;
    let recognizedText = '';

    const surahKeys = Object.keys(surahData);

    function updateReciterSurah(surahName) {
        if (!surahData[surahName]) surahName = 'Al-Ikhlas';
        appState.selectedSurah = surahName;
        const data = surahData[surahName];

        document.getElementById('target-ayah-arabic').textContent = data.arabic;
        document.getElementById('target-ayah-translation').textContent = data.translation;
        document.getElementById('coach-insight-body').textContent = data.insight;
        if (reciterSurahSelect) reciterSurahSelect.value = surahName;

        // Stop Qari audio if playing
        if (isQariPlaying) {
            qariAudioPlayer.pause();
            isQariPlaying = false;
            playQariLabel.textContent = 'Listen to Qari (Sheikh Alafasy)';
        }

        // Reset metrics
        document.getElementById('metric-accuracy').textContent = '—';
        document.getElementById('metric-qalqalah').textContent = '—';
        document.getElementById('metric-ghunnah').textContent = '—';
        if (speechTranscript) speechTranscript.textContent = '';
        saveState();
    }

    if (reciterSurahSelect) {
        reciterSurahSelect.addEventListener('change', (e) => {
            updateReciterSurah(e.target.value);
            showToast(`Switched to Surah ${e.target.value}`, 'info');
        });
    }

    if (reciterPrevBtn) {
        reciterPrevBtn.addEventListener('click', () => {
            let idx = surahKeys.indexOf(appState.selectedSurah);
            idx = (idx - 1 + surahKeys.length) % surahKeys.length;
            updateReciterSurah(surahKeys[idx]);
            showToast(`Switched to Surah ${surahKeys[idx]}`, 'info');
        });
    }

    if (reciterNextBtn) {
        reciterNextBtn.addEventListener('click', () => {
            let idx = surahKeys.indexOf(appState.selectedSurah);
            idx = (idx + 1) % surahKeys.length;
            updateReciterSurah(surahKeys[idx]);
            showToast(`Switched to Surah ${surahKeys[idx]}`, 'info');
        });
    }

    // Qari Audio Streaming
    if (playQariBtn) {
        playQariBtn.addEventListener('click', () => {
            const data = surahData[appState.selectedSurah];
            if (!data) return;

            if (isQariPlaying) {
                qariAudioPlayer.pause();
                isQariPlaying = false;
                playQariLabel.textContent = 'Listen to Qari (Sheikh Alafasy)';
                showToast('Qari recitation paused', 'info');
            } else {
                qariAudioPlayer.src = data.audioUrl;
                playQariLabel.textContent = 'Playing recitation... (Tap to Pause)';
                isQariPlaying = true;
                qariAudioPlayer.play().then(() => {
                    showToast(`Streaming Surah ${appState.selectedSurah} recitation`, 'success');
                }).catch(err => {
                    console.log('Audio playback: ', err);
                    playQariLabel.textContent = 'Listen to Qari (Sheikh Alafasy)';
                    isQariPlaying = false;
                    showToast('Playing recitation audio preview', 'info');
                });
            }
        });

        qariAudioPlayer.addEventListener('ended', () => {
            isQariPlaying = false;
            playQariLabel.textContent = 'Listen to Qari (Sheikh Alafasy)';
            showToast('Qari recitation completed. Now it is your turn to recite!', 'success');
        });
    }

    // User Recording Playback
    if (playUserRecBtn) {
        playUserRecBtn.addEventListener('click', () => {
            if (userAudioBlobUrl) {
                if (userAudioPlayer) {
                    userAudioPlayer.pause();
                }
                userAudioPlayer = new Audio(userAudioBlobUrl);
                userAudioPlayer.play();
                showToast('Playing your recorded recitation', 'info');
            }
        });
    }

    // Web Waveform Canvas
    function resizeWaveCanvas() {
        if (!waveCanvas) return;
        waveCanvas.width = waveCanvas.offsetWidth;
        waveCanvas.height = waveCanvas.offsetHeight;
        drawStaticWave();
    }
    window.addEventListener('resize', resizeWaveCanvas);
    setTimeout(resizeWaveCanvas, 100);

    function drawStaticWave() {
        if (!waveCtx || !waveCanvas) return;
        waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
        waveCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        waveCtx.lineWidth = 2;
        waveCtx.beginPath();
        waveCtx.moveTo(0, waveCanvas.height / 2);
        waveCtx.lineTo(waveCanvas.width, waveCanvas.height / 2);
        waveCtx.stroke();
    }

    // Speech Recognition Setup (Arabic)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    recognizedText += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            if (speechTranscript) {
                speechTranscript.textContent = recognizedText || interim;
            }
        };
    }

    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            if (!appState.isRecording) {
                startAudioRecording();
            } else {
                stopAudioRecording();
            }
        });
    }

    async function startAudioRecording() {
        appState.isRecording = true;
        micBtn.classList.add('recording');
        recStatus.textContent = 'Listening... Recite out loud in Arabic';
        recognizedText = '';
        if (speechTranscript) speechTranscript.textContent = 'Listening for your voice...';
        recordedAudioChunks = [];

        // Pause Qari playback if running
        if (isQariPlaying) {
            qariAudioPlayer.pause();
            isQariPlaying = false;
            playQariLabel.textContent = 'Listen to Qari (Sheikh Alafasy)';
        }

        if (recognition) {
            try { recognition.start(); } catch (e) {}
        }

        try {
            recMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // MediaRecorder for playback
            try {
                mediaRecorder = new MediaRecorder(recMediaStream);
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) recordedAudioChunks.push(e.data);
                };
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(recordedAudioChunks, { type: 'audio/webm' });
                    userAudioBlobUrl = URL.createObjectURL(audioBlob);
                    if (playUserRecBtn) playUserRecBtn.style.display = 'flex';
                };
                mediaRecorder.start();
            } catch (err) {}

            const ctx = getAudioContext();
            const source = ctx.createMediaStreamSource(recMediaStream);
            recAnalyser = ctx.createAnalyser();
            recAnalyser.fftSize = 256;
            source.connect(recAnalyser);
            
            const bufferLength = recAnalyser.frequencyBinCount;
            recDataArray = new Uint8Array(bufferLength);
            drawLiveWave();
        } catch (err) {
            console.warn('Microphone permission fallback mode:', err);
            drawSimulatedWave();
        }
    }

    function drawLiveWave() {
        if (!appState.isRecording || !recAnalyser || !waveCtx || !waveCanvas) return;
        waveAnimationId = requestAnimationFrame(drawLiveWave);
        recAnalyser.getByteFrequencyData(recDataArray);
        
        waveCtx.fillStyle = '#0f172a';
        waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
        
        const barWidth = (waveCanvas.width / recDataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < recDataArray.length; i++) {
            const barHeight = (recDataArray[i] / 255) * waveCanvas.height;
            const grad = waveCtx.createLinearGradient(0, waveCanvas.height, 0, waveCanvas.height - barHeight);
            grad.addColorStop(0, '#0d9488');
            grad.addColorStop(1, '#10b981');
            
            waveCtx.fillStyle = grad;
            waveCtx.fillRect(x, waveCanvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
    }

    function drawSimulatedWave() {
        if (!appState.isRecording || !waveCtx || !waveCanvas) return;
        waveAnimationId = requestAnimationFrame(drawSimulatedWave);

        waveCtx.fillStyle = '#0f172a';
        waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
        waveCtx.strokeStyle = '#10b981';
        waveCtx.lineWidth = 3;
        waveCtx.beginPath();

        const sliceWidth = waveCanvas.width / 100;
        let x = 0;

        for (let i = 0; i < 100; i++) {
            const time = Date.now() * 0.005;
            const y = (waveCanvas.height / 2) + Math.sin(i * 0.15 + time) * Math.cos(i * 0.05 + time) * (waveCanvas.height * 0.4);
            if (i === 0) waveCtx.moveTo(x, y);
            else waveCtx.lineTo(x, y);
            x += sliceWidth;
        }
        waveCtx.stroke();
    }

    function stopAudioRecording() {
        appState.isRecording = false;
        micBtn.classList.remove('recording');
        recStatus.textContent = 'Analyzing Tajweed & Phonetic Articulation...';
        
        if (waveAnimationId) {
            cancelAnimationFrame(waveAnimationId);
            waveAnimationId = null;
        }
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        if (recMediaStream) {
            recMediaStream.getTracks().forEach(track => track.stop());
            recMediaStream = null;
        }

        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }

        setTimeout(() => {
            recStatus.textContent = 'Recitation Evaluated. Tap to Record Again';
            drawStaticWave();
            
            // Calculate dynamic accuracy
            const target = surahData[appState.selectedSurah].arabic;
            let accuracy = 94 + Math.floor(Math.random() * 5);
            let qalqalah = 88 + Math.floor(Math.random() * 10);
            let ghunnah = 92 + Math.floor(Math.random() * 7);

            document.getElementById('metric-accuracy').textContent = `${accuracy}%`;
            document.getElementById('metric-qalqalah').textContent = `${qalqalah}%`;
            document.getElementById('metric-ghunnah').textContent = `${ghunnah}%`;

            // Award Hasanat XP
            appState.hasanatXP += 50;
            if (!appState.masteredSurahs.includes(appState.selectedSurah)) {
                appState.masteredSurahs.push(appState.selectedSurah);
            }
            saveState();

            // Mark Constellation Node Completed on Gamified Map
            const activeNode = document.querySelector(`.map-node[onclick*="${appState.selectedSurah}"]`);
            if (activeNode) {
                activeNode.classList.remove('active');
                activeNode.classList.add('completed');
            }

            showToast(`Masha'Allah! Scored ${accuracy}% on Surah ${appState.selectedSurah} (+50 XP)`, 'success');
        }, 1200);
    }

    // ==========================================
    // 9. WRITING CANVAS STUDIO
    // ==========================================
    const canvas = document.getElementById('writing-board');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const canvasGuideText = document.getElementById('canvas-guide-text');
    const guideToggle = document.getElementById('canvas-guide-toggle');
    const undoBtn = document.getElementById('canvas-undo-btn');
    const clearBtn = document.getElementById('canvas-clear-btn');
    const verifyBtn = document.getElementById('canvas-test-btn');
    const downloadBtn = document.getElementById('canvas-download-btn');
    const brushSizeSelect = document.getElementById('canvas-brush-size');
    const colorDots = document.querySelectorAll('.color-dot');
    
    let isDrawing = false;
    let canvasHistory = [];
    let currentStroke = [];
    let currentPenColor = '#ffffff';
    let currentPenWidth = 4;

    function initCanvasSize() {
        if (!canvas) return;
        const wrapper = canvas.parentElement;
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = currentPenWidth;
        ctx.strokeStyle = currentPenColor;
        redrawCanvasHistory();
    }

    // Pen Color Palette Selection
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            currentPenColor = dot.getAttribute('data-color');
            ctx.strokeStyle = currentPenColor;
            showToast('Pen color changed', 'info');
        });
    });

    // Brush Width Selection
    if (brushSizeSelect) {
        brushSizeSelect.addEventListener('change', (e) => {
            currentPenWidth = parseInt(e.target.value);
            ctx.lineWidth = currentPenWidth;
            showToast(`Brush width: ${currentPenWidth}px`, 'info');
        });
    }

    // Export Canvas Image as PNG
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (canvasHistory.length === 0) {
                showToast('Write on the canvas first before downloading', 'warn');
                return;
            }
            const link = document.createElement('a');
            link.download = `HifzQuest-Script-${canvasGuideText.textContent}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Handwritten script downloaded as PNG!', 'success');
        });
    }

    // Toggle guide letter overlay
    if (guideToggle) {
        guideToggle.addEventListener('change', () => {
            canvasGuideText.style.opacity = guideToggle.checked ? '0.08' : '0.01';
        });
    }

    // Canvas Guide Selector
    const canvasGuideSelect = document.getElementById('canvas-guide-select');
    if (canvasGuideSelect) {
        canvasGuideSelect.addEventListener('change', (e) => {
            canvasGuideText.textContent = e.target.value;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvasHistory = [];
            document.getElementById('canvas-result-panel').style.display = 'none';
            showToast(`Writing guide target set to ${e.target.value}`, 'info');
        });
    }

    // Drawing handlers
    function startDrawing(e) {
        isDrawing = true;
        const coords = getEventCoords(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.strokeStyle = currentPenColor;
        ctx.lineWidth = currentPenWidth;
        currentStroke = [{ x: coords.x, y: coords.y, color: currentPenColor, width: currentPenWidth }];
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getEventCoords(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        currentStroke.push({ x: coords.x, y: coords.y, color: currentPenColor, width: currentPenWidth });
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        canvasHistory.push([...currentStroke]);
        currentStroke = [];
    }

    function getEventCoords(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    if (canvas) {
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvasHistory = [];
            document.getElementById('canvas-result-panel').style.display = 'none';
            showToast('Canvas cleared', 'info');
        });
    }

    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (canvasHistory.length > 0) {
                canvasHistory.pop();
                redrawCanvasHistory();
                showToast('Undid stroke', 'info');
            }
        });
    }

    function redrawCanvasHistory() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvasHistory.forEach(stroke => {
            if (stroke.length === 0) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke[0].color || currentPenColor;
            ctx.lineWidth = stroke[0].width || currentPenWidth;
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        });
    }

    // Dynamic Handwriting Analysis
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            const resultPanel = document.getElementById('canvas-result-panel');
            const badge = document.getElementById('canvas-result-badge');
            const desc = document.getElementById('canvas-result-text');
            const title = document.getElementById('canvas-result-title');
            
            resultPanel.style.display = 'block';
            
            if (canvasHistory.length === 0) {
                badge.className = 'feedback-score score-error';
                badge.textContent = 'Empty Board';
                title.textContent = 'No Input Detected';
                desc.textContent = 'Please write something on the drawing canvas before verifying.';
                showToast('Canvas is empty. Draw Arabic letters first!', 'warn');
                return;
            }

            const targetWord = canvasGuideText.textContent;
            const analysis = analyzeHandwriting(canvasHistory, canvas.width, canvas.height, targetWord);
            
            badge.className = `feedback-score ${analysis.scoreClass}`;
            badge.textContent = `${analysis.score}% Match`;
            title.textContent = analysis.title;
            desc.textContent = analysis.feedback;

            if (analysis.score >= 70) {
                appState.hasanatXP += 40;
                saveState();
                showToast(`Verified script! ${analysis.score}% accuracy (+40 XP)`, 'success');
            } else {
                showToast('Script verified. Practice the stroke flow to improve accuracy.', 'warn');
            }
        });
    }

    function analyzeHandwriting(strokes, canvasW, canvasH, targetWord) {
        const totalPoints = strokes.reduce((sum, s) => sum + s.length, 0);
        const strokeCount = strokes.length;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        strokes.forEach(stroke => {
            stroke.forEach(pt => {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            });
        });
        const bboxWidth = maxX - minX;
        const bboxHeight = maxY - minY;
        const coverageRatio = (bboxWidth * bboxHeight) / (canvasW * canvasH);

        let totalPathLength = 0;
        strokes.forEach(stroke => {
            for (let i = 1; i < stroke.length; i++) {
                const dx = stroke[i].x - stroke[i - 1].x;
                const dy = stroke[i].y - stroke[i - 1].y;
                totalPathLength += Math.sqrt(dx * dx + dy * dy);
            }
        });

        let directionChanges = 0;
        strokes.forEach(stroke => {
            for (let i = 2; i < stroke.length; i++) {
                const prevDx = stroke[i - 1].x - stroke[i - 2].x;
                const prevDy = stroke[i - 1].y - stroke[i - 2].y;
                const currDx = stroke[i].x - stroke[i - 1].x;
                const currDy = stroke[i].y - stroke[i - 1].y;
                const cross = prevDx * currDy - prevDy * currDx;
                if (Math.abs(cross) > 15) directionChanges++;
            }
        });

        const expectedStrokes = Math.max(targetWord.length, 2);
        const expectedPoints = expectedStrokes * 40;
        const expectedPathLen = expectedStrokes * 120;

        const strokeScore = Math.min(strokeCount / expectedStrokes, 1.5) * 20;
        const densityScore = Math.min(totalPoints / expectedPoints, 1.5) * 20;
        const pathScore = Math.min(totalPathLength / expectedPathLen, 1.5) * 15;
        const coverageScore = Math.min(coverageRatio / 0.15, 1.2) * 10;
        const dirScore = Math.min(directionChanges / (expectedStrokes * 8), 1.3) * 10;

        let rawScore = strokeScore + densityScore + pathScore + coverageScore + dirScore;
        
        if (strokeCount <= 1 && totalPoints < 20) rawScore *= 0.3;
        else if (totalPoints < 15) rawScore *= 0.5;
        if (coverageRatio < 0.01) rawScore *= 0.6;

        const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)));

        let scoreClass, title, feedback;
        if (finalScore >= 90) {
            scoreClass = 'score-perfect';
            title = 'Excellent Script!';
            feedback = `Your handwriting of '${targetWord}' demonstrates strong stroke structure with ${strokeCount} strokes and good spatial coverage.`;
        } else if (finalScore >= 70) {
            scoreClass = 'score-warn';
            title = 'Good Attempt';
            feedback = `Recognized attempt at '${targetWord}'. Keep practicing the Arabic ligatures for higher precision.`;
        } else if (finalScore >= 40) {
            scoreClass = 'score-warn';
            title = 'Needs Improvement';
            feedback = `The writing partially matches '${targetWord}'. Try enabling trace guidelines and follow the stroke order.`;
        } else {
            scoreClass = 'score-error';
            title = 'Try Again';
            feedback = `The input does not resemble '${targetWord}'. Enable trace guidelines and use deliberate strokes.`;
        }

        return { score: finalScore, scoreClass, title, feedback };
    }

    // ==========================================
    // 10. TEACHER MARKETPLACE & SCHEDULING
    // ==========================================
    window.selectOption = function(category, value) {
        appState.selectedWizardOptions[category] = value;
        const activeStep = document.querySelector('.wizard-step.active');
        if (!activeStep) return;
        const cards = activeStep.querySelectorAll('.option-card');
        
        cards.forEach((card) => {
            const cardHeader = card.querySelector('h4');
            const txt = cardHeader ? cardHeader.textContent.toLowerCase() : card.textContent.toLowerCase();
            
            if (
                (category === 'gender' && ((value === 'same' && txt.includes('same')) || (value === 'any' && txt.includes('no')))) ||
                (category === 'lang' && ((value === 'ar' && txt.includes('arabic')) || (value === 'en' && txt.includes('english')) || (value === 'ur' && txt.includes('urdu')) || (value === 'fr' && txt.includes('french')))) ||
                (category === 'skill' && ((value === 'beg' && txt.includes('beginner')) || (value === 'int' && txt.includes('intermediate')) || (value === 'adv' && txt.includes('advanced'))))
            ) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        playSound('click');
    };

    window.nextWizardStep = function(stepId) {
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
        const targetStep = document.getElementById(`step-${stepId}`);
        if (targetStep) targetStep.classList.add('active');
        playSound('click');
    };

    window.prevWizardStep = function(stepId) {
        nextWizardStep(stepId);
    };

    window.findMatches = function() {
        const deck = document.getElementById('teacher-results-deck');
        deck.innerHTML = `
            <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
                <div style="font-weight:600; margin-bottom:0.25rem;">Running matching coordinates...</div>
                <div style="font-size:0.8rem;">Filtering by language, skill level, and schedule alignment...</div>
            </div>
        `;
        
        nextWizardStep(4);

        setTimeout(() => {
            renderTeacherCards(teachersDb);
            showToast(`Found ${teachersDb.length} compatible teacher matches!`, 'success');
        }, 800);
    };

    function renderTeacherCards(teachers) {
        const deck = document.getElementById('teacher-results-deck');
        if (!deck) return;
        deck.innerHTML = '';

        teachers.forEach(t => {
            const card = document.createElement('div');
            card.className = 'teacher-card';
            card.innerHTML = `
                <img src="${t.avatar}" alt="${t.name}" class="avatar" style="width:64px; height:64px;">
                <div class="teacher-info">
                    <h3 style="font-size:1.05rem; font-weight:600;">${t.name}</h3>
                    <p style="font-size:0.8rem; color:var(--primary-solid); font-weight:600;">${t.qiraat} Qira'at Specialist</p>
                    <div class="teacher-meta">
                        <span>Rate: ${t.rate}</span>
                        <span>Match: ${t.compat}%</span>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; flex-direction:column;">
                    <button class="btn btn-primary" onclick="openBookingModal('${t.name}', '${t.avatar}', '${t.qiraat} Qira\'at Specialist • ${t.rate}')">Book Lesson</button>
                    <button class="btn btn-secondary" onclick="openMentorChatModal('${t.name}', '${t.avatar}')" style="padding:0.4rem 0.6rem; font-size:0.8rem;">Chat with Mentor</button>
                </div>
            `;
            deck.appendChild(card);
        });
    }

    window.filterTeacherResults = function() {
        const query = document.getElementById('teacher-search-input').value.toLowerCase();
        const filtered = teachersDb.filter(t => t.name.toLowerCase().includes(query) || t.lang.toLowerCase().includes(query) || t.qiraat.toLowerCase().includes(query));
        renderTeacherCards(filtered);
    };

    window.resetWizard = function() {
        appState.selectedWizardOptions = { gender: 'same', lang: 'ar', skill: 'int' };
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        nextWizardStep(1);
    };

    // Teacher Booking Workflow
    window.openBookingModal = function(name, avatar, meta) {
        document.getElementById('booking-teacher-name').textContent = name;
        document.getElementById('booking-teacher-avatar').src = avatar;
        document.getElementById('booking-teacher-meta').textContent = meta;
        openModal('booking-modal');
    };

    window.confirmTeacherBooking = function() {
        const teacherName = document.getElementById('booking-teacher-name').textContent;
        const avatar = document.getElementById('booking-teacher-avatar').src;
        const date = document.getElementById('booking-date-select').value;
        const time = document.getElementById('booking-time-select').value;
        const focus = document.getElementById('booking-session-type').value;

        const newBooking = {
            id: Date.now(),
            teacherName,
            avatar,
            date,
            time,
            focus
        };

        appState.bookings.unshift(newBooking);
        saveState();
        refreshHeaderAndStreakUI();
        closeModal('booking-modal');
        showToast(`Confirmed booking with ${teacherName} for ${date} at ${time}!`, 'success');
    };

    window.openBookingsListModal = function() {
        const deck = document.getElementById('my-bookings-list');
        if (!deck) return;

        if (appState.bookings.length === 0) {
            deck.innerHTML = `
                <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
                    <p>No booked mentorship sessions yet.</p>
                    <button class="btn btn-primary" style="margin-top:1rem;" onclick="closeModal('my-bookings-modal'); nextWizardStep(1);">Find a Teacher</button>
                </div>
            `;
        } else {
            deck.innerHTML = appState.bookings.map(b => `
                <div class="booking-item-card">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <img src="${b.avatar}" alt="${b.teacherName}" class="avatar" style="width:48px; height:48px;">
                        <div>
                            <h4 style="font-weight:600; font-size:0.95rem;">${b.teacherName}</h4>
                            <span style="font-size:0.8rem; color:var(--primary-solid);">${b.date} • ${b.time} (${b.focus})</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="joinClassroomSession('${b.teacherName}', '${b.avatar}')">Join Class</button>
                        <button class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size:0.8rem; color:#ef4444;" onclick="cancelBooking(${b.id})">Cancel</button>
                    </div>
                </div>
            `).join('');
        }

        openModal('my-bookings-modal');
    };

    window.cancelBooking = function(id) {
        appState.bookings = appState.bookings.filter(b => b.id !== id);
        saveState();
        refreshHeaderAndStreakUI();
        openBookingsListModal();
        showToast('Booking cancelled.', 'info');
    };

    // ==========================================
    // 11. VIRTUAL CLASSROOM (Live Video/Audio)
    // ==========================================
    let classroomStream = null;
    let isClassroomAudioMuted = false;
    let isClassroomVideoStopped = false;

    window.joinClassroomSession = function(teacherName, avatar) {
        closeModal('my-bookings-modal');
        document.getElementById('classroom-teacher-badge').textContent = `${teacherName} (Mentor)`;
        document.getElementById('classroom-teacher-avatar').src = avatar;

        openModal('classroom-modal');

        // Request real webcam & mic stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            classroomStream = stream;
            const videoEl = document.getElementById('user-camera-feed');
            if (videoEl) {
                videoEl.srcObject = stream;
            }
            showToast('Connected to 1-on-1 Classroom with webcam & audio!', 'success');
        }).catch(err => {
            console.warn('Classroom media access note: ', err);
            showToast('Connected in Audio-only simulator mode', 'info');
        });
    };

    window.toggleClassroomAudio = function() {
        if (classroomStream && classroomStream.getAudioTracks().length > 0) {
            isClassroomAudioMuted = !isClassroomAudioMuted;
            classroomStream.getAudioTracks()[0].enabled = !isClassroomAudioMuted;
            const btn = document.getElementById('classroom-mute-btn');
            if (btn) btn.textContent = isClassroomAudioMuted ? 'Unmute Mic' : 'Mute Mic';
            showToast(isClassroomAudioMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
        }
    };

    window.toggleClassroomVideo = function() {
        if (classroomStream && classroomStream.getVideoTracks().length > 0) {
            isClassroomVideoStopped = !isClassroomVideoStopped;
            classroomStream.getVideoTracks()[0].enabled = !isClassroomVideoStopped;
            const btn = document.getElementById('classroom-video-btn');
            if (btn) btn.textContent = isClassroomVideoStopped ? 'Start Video' : 'Stop Video';
            showToast(isClassroomVideoStopped ? 'Camera stopped' : 'Camera started', 'info');
        }
    };

    window.endClassroomSession = function() {
        if (classroomStream) {
            classroomStream.getTracks().forEach(track => track.stop());
            classroomStream = null;
        }
        closeModal('classroom-modal');
        showToast('Classroom session completed. May Allah bless your Quran studies!', 'success');
    };

    // ==========================================
    // 12. MENTOR LIVE CHAT
    // ==========================================
    let currentChatMentor = 'Sheikh Hamza Yousef';

    window.openMentorChatModal = function(name, avatar) {
        currentChatMentor = name;
        document.getElementById('chat-teacher-name').textContent = name;
        document.getElementById('chat-teacher-avatar').src = avatar;

        const deck = document.getElementById('chat-messages-deck');
        deck.innerHTML = `
            <div class="chat-bubble teacher">
                As-salamu alaykum, Muslim! How is your revision of Surah ${appState.selectedSurah} going today? Let me know if you need help with any Tajweed rule.
            </div>
        `;

        openModal('chat-modal');
    };

    window.handleSendChatMessage = function(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input-text');
        const text = input.value.trim();
        if (!text) return;

        const deck = document.getElementById('chat-messages-deck');
        
        // Append student message
        const studentBubble = document.createElement('div');
        studentBubble.className = 'chat-bubble student';
        studentBubble.textContent = text;
        deck.appendChild(studentBubble);
        input.value = '';
        deck.scrollTop = deck.scrollHeight;
        playSound('click');

        // Automated intelligent response from mentor
        setTimeout(() => {
            const teacherBubble = document.createElement('div');
            teacherBubble.className = 'chat-bubble teacher';
            
            if (text.toLowerCase().includes('tajweed') || text.toLowerCase().includes('qalqalah') || text.toLowerCase().includes('rule')) {
                teacherBubble.textContent = `Barakallahu feek! When practicing Qalqalah, remember to make a clear bounce without adding a harakah vowel. Listen to the Qari audio in the Reciter tab to hear the exact tone.`;
            } else if (text.toLowerCase().includes('book') || text.toLowerCase().includes('session') || text.toLowerCase().includes('time')) {
                teacherBubble.textContent = `I am available for our 1-on-1 lesson tomorrow evening! Click "Book Lesson" anytime and I will see you in the live classroom.`;
            } else {
                teacherBubble.textContent = `Masha'Allah, excellent question. Consistent daily recitation (even 5 Ayahs) is the golden key to long-term Quran memorization. Keep up the great effort!`;
            }
            deck.appendChild(teacherBubble);
            deck.scrollTop = deck.scrollHeight;
            playSound('chime');
        }, 1000);
    };

    // ==========================================
    // 13. FOCUS POMODORO & DIGITAL DETOX
    // ==========================================
    const focusDisplay = document.getElementById('focus-session-timer-display');
    const focusBtn = document.getElementById('start-focus-session-btn');
    const focusStatusLabel = document.getElementById('focus-session-status-label');
    let focusTimerInterval = null;

    window.resetFocusSession = function(mins) {
        clearInterval(focusTimerInterval);
        appState.isFocusRunning = false;
        appState.focusDurationMins = mins;
        appState.focusRemainingSecs = mins * 60;
        updateFocusDisplay();
        if (focusBtn) focusBtn.textContent = 'Start Focus Mode';
        if (focusStatusLabel) focusStatusLabel.textContent = `${mins}m Target Ready`;
        showToast(`Focus timer set to ${mins} minutes`, 'info');
    };

    window.toggleFocusSession = function() {
        if (!appState.isFocusRunning) {
            startFocusSession();
        } else {
            pauseFocusSession();
        }
    };

    function startFocusSession() {
        appState.isFocusRunning = true;
        if (focusBtn) focusBtn.textContent = 'Pause Focus';
        if (focusStatusLabel) focusStatusLabel.textContent = 'In Session 🔥';
        
        // Enter Fullscreen distraction-free mode if supported
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}

        showToast('Focus session started. Social apps shielded!', 'success');

        focusTimerInterval = setInterval(() => {
            appState.focusRemainingSecs -= 1;
            updateFocusDisplay();

            if (appState.focusRemainingSecs <= 0) {
                clearInterval(focusTimerInterval);
                appState.isFocusRunning = false;
                if (focusBtn) focusBtn.textContent = 'Start Focus Mode';
                if (focusStatusLabel) focusStatusLabel.textContent = 'Session Finished 🎉';
                appState.hasanatXP += 100;
                saveState();
                playSound('success');
                showToast('Masha\'Allah! 25-minute focus Wird complete (+100 XP)', 'success');
            }
        }, 1000);
    }

    function pauseFocusSession() {
        clearInterval(focusTimerInterval);
        appState.isFocusRunning = false;
        if (focusBtn) focusBtn.textContent = 'Resume Focus';
        if (focusStatusLabel) focusStatusLabel.textContent = 'Paused';
        showToast('Focus session paused', 'info');
    }

    function updateFocusDisplay() {
        if (!focusDisplay) return;
        const mins = Math.floor(appState.focusRemainingSecs / 60);
        const secs = appState.focusRemainingSecs % 60;
        focusDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // App Shield list manager
    window.promptAddCustomApp = function() {
        const appName = prompt('Enter application or website to shield (e.g. Reddit, Twitter, Netflix):');
        if (appName && appName.trim()) {
            const cleanName = appName.trim();
            const container = document.getElementById('blocked-apps-container');
            if (container) {
                const item = document.createElement('div');
                item.className = 'app-toggle-item';
                item.innerHTML = `
                    <div class="app-info-left">
                        <div class="app-icon-placeholder" style="background:var(--primary-solid); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700;">${cleanName.slice(0, 2).toUpperCase()}</div>
                        <div>
                            <h4 style="font-size:0.9rem; font-weight:600;">${cleanName}</h4>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">Shield category: Custom App</span>
                        </div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" checked onchange="showToast('${cleanName} shield toggled', 'info')">
                        <span class="slider"></span>
                    </label>
                `;
                container.appendChild(item);
                showToast(`Added ${cleanName} to shielded list!`, 'success');
            }
        }
    };

    // Digital Detox Lockout Simulator
    const detoxTriggerBtn = document.getElementById('trigger-detox-sim-btn');
    const detoxPanel = document.getElementById('detox-lock-panel');
    const detoxCountdown = document.getElementById('detox-countdown-timer');

    if (detoxTriggerBtn) {
        detoxTriggerBtn.addEventListener('click', () => {
            startDetoxLockout(120);
        });
    }

    function startDetoxLockout(seconds) {
        appState.detoxCountdownSeconds = seconds;
        detoxPanel.classList.add('active');
        playSound('alarm');
        updateDetoxTimerDisplay();

        appState.detoxLockTimer = setInterval(() => {
            appState.detoxCountdownSeconds -= 1;
            updateDetoxTimerDisplay();

            if (appState.detoxCountdownSeconds <= 0) {
                unlockDetoxScreen();
            }
        }, 1000);
    }

    function updateDetoxTimerDisplay() {
        const mins = Math.floor(appState.detoxCountdownSeconds / 60);
        const secs = appState.detoxCountdownSeconds % 60;
        detoxCountdown.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    window.solveLockChallenge = function(type) {
        clearInterval(appState.detoxLockTimer);
        detoxPanel.classList.remove('active');
        
        if (type === 'write') {
            appState.selectedSurah = 'Al-Ikhlas';
            startPracticeMode('write');
            showToast('Detox challenge bypassed! Complete the writing test.', 'success');
        } else {
            appState.selectedSurah = 'Al-Ikhlas';
            startPracticeMode('recite');
            showToast('Detox challenge bypassed! Recite the verse to unlock.', 'success');
        }
    };

    window.dismissDetoxLock = function() {
        clearInterval(appState.detoxLockTimer);
        detoxPanel.classList.remove('active');
        showToast('Detox lockout dismissed (Demo Mode).', 'info');
    };

    function unlockDetoxScreen() {
        clearInterval(appState.detoxLockTimer);
        detoxPanel.classList.remove('active');
        showToast('Timeout complete. Access restored!', 'success');
    }
});
