document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STORES / CONFIGS ---
    const appState = {
        selectedSurah: 'Al-Ikhlas',
        currentTab: 'dashboard',
        isRecording: false,
        streakCount: 12,
        selectedWizardOptions: {
            gender: 'same',
            lang: 'ar',
            skill: 'int'
        },
        detoxLockTimer: null,
        detoxCountdownSeconds: 120
    };

    // Quran Data Mock for Active Modes
    const surahData = {
        'An-Nas': { arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: '"Say, I seek refuge in the Lord of mankind"', guide: 'الناس' },
        'Al-Falaq': { arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: '"Say, I seek refuge in the Lord of daybreak"', guide: 'الفلق' },
        'Al-Ikhlas': { arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: '"Say, He is Allah, [who is] One"', guide: 'الله' },
        'Al-Kafirun': { arabic: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ', translation: '"Say, O disbelievers..."', guide: 'الكافرون' }
    };

    // Teacher Profiles Mock Database
    const teachersDb = [
        { name: 'Sheikh Hamza Yousef', gender: 'male', lang: 'en', skill: 'adv', qiraat: 'Hafs', rate: '$25/hr', compat: 98, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
        { name: 'Ustadha Fatima Al-Zahra', gender: 'female', lang: 'ar', skill: 'int', qiraat: 'Warsh', rate: '$20/hr', compat: 95, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
        { name: 'Hafiz Tariq Mahmood', gender: 'male', lang: 'ur', skill: 'beg', qiraat: 'Hafs', rate: '$15/hr', compat: 91, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
        { name: 'Sheikh Yasser Al-Masri', gender: 'male', lang: 'ar', skill: 'adv', qiraat: 'Hafs', rate: '$30/hr', compat: 96, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
        { name: 'Ustadha Aisha Siddiqa', gender: 'female', lang: 'en', skill: 'int', qiraat: 'Hafs', rate: '$22/hr', compat: 94, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100' }
    ];

    // --- TAB SWITCH ENGINE ---
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const sections = document.querySelectorAll('.app-section');

    function bindNavEvents(elements) {
        elements.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = item.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });
    }

    bindNavEvents(navItems);
    bindNavEvents(mobileNavItems);

    function switchTab(tabId) {
        // Sync active states on all nav wrappers
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
            window.location.hash = tabId;

            // Handle special tab initialization callbacks
            if (tabId === 'canvas') {
                initCanvasSize();
            }
        }
    }

    // Hash navigation fallback
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if (['dashboard', 'map', 'reciter', 'canvas', 'matching', 'detox'].includes(hash)) {
            switchTab(hash);
        }
    }

    // --- THEME SWITCH ENGINE ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleText = document.getElementById('theme-toggle-text');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            if (isLight) {
                themeToggleText.textContent = 'Dark Mode';
                themeToggleIcon.innerHTML = `<path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,2A1,1 0 0,1 13,3V5A1,1 0 0,1 11,5V3A1,1 0 0,1 12,2M12,19A1,1 0 0,1 13,20V22A1,1 0 0,1 11,22V20A1,1 0 0,1 12,19M2,12A1,1 0 0,1 3,11H5A1,1 0 0,1 5,13H3A1,1 0 0,1 2,12M19,12A1,1 0 0,1 20,11H22A1,1 0 0,1 22,13H20A1,1 0 0,1 19,12M4.93,4.93A1,1 0 0,1 6.34,4.93L7.76,6.34A1,1 0 0,1 6.34,7.76L4.93,6.34A1,1 0 0,1 4.93,4.93M16.24,16.24A1,1 0 0,1 17.66,16.24L19.07,17.66A1,1 0 0,1 17.66,19.07L16.24,17.66A1,1 0 0,1 16.24,16.24M19.07,4.93A1,1 0 0,1 19.07,6.34L17.66,7.76A1,1 0 0,1 16.24,6.34L17.66,4.93A1,1 0 0,1 19.07,4.93M6.34,16.24L7.76,17.66A1,1 0 0,1 6.34,19.07L4.93,17.66A1,1 0 0,1 6.34,16.24Z"/>`;
            } else {
                themeToggleText.textContent = 'Light Mode';
                themeToggleIcon.innerHTML = `<path d="M12,18C11.11,18 10.26,17.8 9.5,17.45C11.56,16.5 13,14.42 13,12C13,9.58 11.56,7.5 9.5,6.55C10.26,6.2 11.11,6 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>`;
            }
            
            // Re-initialize canvas to fetch the correct light/dark line color
            if (appState.currentTab === 'canvas') {
                initCanvasSize();
            }
        });
    }


    // --- MAP / PRACTICE MODAL INTERFACE ---
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
        const modal = document.getElementById('practice-modal');
        if (modal) modal.classList.remove('active');
    };

    window.startPracticeMode = function(type) {
        closePracticeModal();
        const data = surahData[appState.selectedSurah];

        if (type === 'recite') {
            document.getElementById('target-ayah-arabic').textContent = data.arabic;
            document.getElementById('target-ayah-translation').textContent = data.translation;
            switchTab('reciter');
        } else if (type === 'write') {
            document.getElementById('canvas-guide-text').textContent = data.guide;
            switchTab('canvas');
        }
    };


    // --- AI RECITER & AUDIO WAVE ENGINE ---
    const micBtn = document.getElementById('mic-trigger-btn');
    const recStatus = document.getElementById('recording-status');
    const waveCanvas = document.getElementById('audio-wave');
    const waveCtx = waveCanvas.getContext('2d');
    
    let waveAnimationId = null;
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let mediaStream = null;

    // Draw static baseline wave preview
    function resizeWaveCanvas() {
        waveCanvas.width = waveCanvas.offsetWidth;
        waveCanvas.height = waveCanvas.offsetHeight;
        drawStaticWave();
    }
    window.addEventListener('resize', resizeWaveCanvas);
    setTimeout(resizeWaveCanvas, 100);

    function drawStaticWave() {
        waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
        waveCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        waveCtx.lineWidth = 2;
        waveCtx.beginPath();
        waveCtx.moveTo(0, waveCanvas.height / 2);
        waveCtx.lineTo(waveCanvas.width, waveCanvas.height / 2);
        waveCtx.stroke();
    }

    micBtn.addEventListener('click', async () => {
        if (!appState.isRecording) {
            startAudioRecording();
        } else {
            stopAudioRecording();
        }
    });

    async function startAudioRecording() {
        appState.isRecording = true;
        micBtn.classList.add('recording');
        recStatus.textContent = 'Reciting... Tap to finish';
        
        // Reset feedback cards to loading state
        const metrics = document.getElementById('feedback-metrics-container');
        metrics.innerHTML = `
            <div style="text-align:center; padding:1.5rem; color:var(--text-secondary);">
                <div style="font-weight:600; margin-bottom:0.25rem;">Live Audio Capture</div>
                <div style="font-size:0.8rem;">Listening to articulation coordinates...</div>
            </div>
        `;

        try {
            // Attempt standard browser mediaStream access
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(mediaStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            drawLiveWave();
        } catch (err) {
            // Fallback simulation if mic access is missing/blocked in sandboxed environment
            console.warn('Microphone permission blocked or unavailable. Falling back to audio simulation.');
            drawSimulatedWave();
        }
    }

    function drawLiveWave() {
        if (!appState.isRecording) return;
        waveAnimationId = requestAnimationFrame(drawLiveWave);
        analyser.getByteFrequencyData(dataArray);
        
        waveCtx.fillStyle = '#0f172a';
        waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
        
        const barWidth = (waveCanvas.width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * waveCanvas.height;
            
            const grad = waveCtx.createLinearGradient(0, waveCanvas.height, 0, waveCanvas.height - barHeight);
            grad.addColorStop(0, '#0d9488');
            grad.addColorStop(1, '#10b981');
            
            waveCtx.fillStyle = grad;
            waveCtx.fillRect(x, waveCanvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
    }

    function drawSimulatedWave() {
        if (!appState.isRecording) return;
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
            
            if (i === 0) {
                waveCtx.moveTo(x, y);
            } else {
                waveCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        waveCtx.stroke();
    }

    function stopAudioRecording() {
        appState.isRecording = false;
        micBtn.classList.remove('recording');
        recStatus.textContent = 'Processing recitation...';
        
        if (waveAnimationId) {
            cancelAnimationFrame(waveAnimationId);
            waveAnimationId = null;
        }
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        if (audioCtx) {
            audioCtx.close();
            audioCtx = null;
        }

        // Post-recording assessment calculation
        setTimeout(() => {
            recStatus.textContent = 'Recitation complete. Tap to record again';
            drawStaticWave();
            
            // Populate realistic Tajweed feedback metrics
            const metrics = document.getElementById('feedback-metrics-container');
            metrics.innerHTML = `
                <div class="feedback-item">
                    <span>Pronunciation Accuracy</span>
                    <span class="feedback-score score-perfect">96%</span>
                </div>
                <div class="feedback-item">
                    <span>Qalqalah (Echo sound)</span>
                    <span class="feedback-score score-warn">82%</span>
                </div>
                <div class="feedback-item">
                    <span>Madd Elongation</span>
                    <span class="feedback-score score-perfect">94%</span>
                </div>
            `;
            
            // Celebrate task node completion
            if (appState.selectedSurah === 'Al-Ikhlas') {
                const node = document.querySelector('.map-node.active');
                if (node) {
                    node.classList.remove('active');
                    node.classList.add('completed');
                    
                    // Increment streak and update dashboard elements
                    appState.streakCount += 1;
                    document.getElementById('streak-count').textContent = `${appState.streakCount} Day Streak`;
                    document.getElementById('dash-wird').innerHTML = `Completed!`;
                    document.getElementById('dash-wird').style.color = '#10b981';
                }
            }
        }, 1500);
    }


    // --- FINGER & STYLUS WRITING CANVAS ---
    const canvas = document.getElementById('writing-board');
    const ctx = canvas.getContext('2d');
    const canvasGuideText = document.getElementById('canvas-guide-text');
    const guideToggle = document.getElementById('canvas-guide-toggle');
    const undoBtn = document.getElementById('canvas-undo-btn');
    const clearBtn = document.getElementById('canvas-clear-btn');
    const verifyBtn = document.getElementById('canvas-test-btn');
    
    let isDrawing = false;
    let canvasHistory = [];
    let currentStroke = [];

    function initCanvasSize() {
        const wrapper = canvas.parentElement;
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-primary').trim() || '#ffffff';
        redrawCanvasHistory();
    }

    // Toggle guide letter overlay
    guideToggle.addEventListener('change', () => {
        canvasGuideText.style.opacity = guideToggle.checked ? '0.08' : '0.01';
    });

    // Drawing handlers (Supporting mouse and touch stylus events)
    function startDrawing(e) {
        isDrawing = true;
        const coords = getEventCoords(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        currentStroke = [{ x: coords.x, y: coords.y }];
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getEventCoords(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        currentStroke.push({ x: coords.x, y: coords.y });
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

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    // Canvas Utility actions
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvasHistory = [];
        document.getElementById('canvas-result-panel').style.display = 'none';
    });

    undoBtn.addEventListener('click', () => {
        if (canvasHistory.length > 0) {
            canvasHistory.pop();
            redrawCanvasHistory();
        }
    });

    function redrawCanvasHistory() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvasHistory.forEach(stroke => {
            if (stroke.length === 0) return;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        });
    }

    verifyBtn.addEventListener('click', () => {
        const resultPanel = document.getElementById('canvas-result-panel');
        const badge = document.getElementById('canvas-result-badge');
        const desc = document.getElementById('canvas-result-text');
        
        resultPanel.style.display = 'block';
        
        if (canvasHistory.length === 0) {
            badge.className = 'feedback-score score-error';
            badge.textContent = 'Empty Board';
            desc.textContent = 'Please write something on the drawing canvas before verifying.';
            return;
        }

        // Simulating handwriting analysis matching
        badge.className = 'feedback-score score-perfect';
        badge.textContent = '95% Accuracy';
        desc.textContent = `The handwriting coordinates match the outline target '${canvasGuideText.textContent}' with correct stroke order. Good job!`;
    });


    // --- MULTI-STEP TEACHER MATCHING WIZARD ---
    window.selectOption = function(category, value) {
        appState.selectedWizardOptions[category] = value;
        
        // Visual selection indicator toggle
        const activeStep = document.querySelector('.wizard-step.active');
        const cards = activeStep.querySelectorAll('.option-card');
        
        cards.forEach((card, idx) => {
            // Check if card matches selected option criteria
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
    };

    window.nextWizardStep = function(stepId) {
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${stepId}`).classList.add('active');
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
            const filters = appState.selectedWizardOptions;
            
            // Filter profiles based on selected preferences
            let matches = teachersDb.filter(t => {
                let genderOk = true;
                if (filters.gender === 'same') {
                    // Simulating matched gender (default user male matching male teachers)
                    genderOk = (t.gender === 'male');
                }
                
                return genderOk && (t.lang === filters.lang || t.skill === filters.skill);
            });

            if (matches.length === 0) {
                matches = teachersDb.slice(0, 2); // Fallback to avoid blank state
            }

            deck.innerHTML = '';
            matches.forEach(t => {
                const card = document.createElement('div');
                card.className = 'teacher-card';
                card.innerHTML = `
                    <img src="${t.avatar}" alt="${t.name}" class="avatar" style="width:64px; height:64px;">
                    <div class="teacher-info">
                        <h3 style="font-size:1.05rem; font-weight:600;">${t.name}</h3>
                        <p style="font-size:0.8rem; color:var(--primary-solid); font-weight:600;">${t.qiraat} Qira'at Specialist</p>
                        <div class="teacher-meta">
                            <span>Rates: ${t.rate}</span>
                            <span>Compatibility: ${t.compat}%</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="alert('Lesson schedule requested with ${t.name}. A message has been dispatched to their dashboard.')">Book Lesson</button>
                `;
                deck.appendChild(card);
            });
        }, 1200);
    };

    window.resetWizard = function() {
        appState.selectedWizardOptions = { gender: 'same', lang: 'ar', skill: 'int' };
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        nextWizardStep(1);
    };


    // --- DIGITAL DETOX ACCOUNTABILITY ENGIMES ---
    const detoxTriggerBtn = document.getElementById('trigger-detox-sim-btn');
    const detoxPanel = document.getElementById('detox-lock-panel');
    const detoxCountdown = document.getElementById('detox-countdown-timer');
    const lockDurationSelector = document.getElementById('detox-lock-duration-selector');

    detoxTriggerBtn.addEventListener('click', () => {
        const durationSeconds = parseInt(lockDurationSelector.value);
        startDetoxLockout(durationSeconds);
    });

    function startDetoxLockout(seconds) {
        appState.detoxCountdownSeconds = seconds;
        detoxPanel.classList.add('active');
        
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
            alert('Detox challenge bypassed! Focus on the trace coordinate writing board to unlock app access.');
        } else {
            appState.selectedSurah = 'Al-Ikhlas';
            startPracticeMode('recite');
            alert('Detox challenge bypassed! Tap the voice recorder to recite the verse correctly.');
        }
    };

    function unlockDetoxScreen() {
        clearInterval(appState.detoxLockTimer);
        detoxPanel.classList.remove('active');
        alert('Timeout complete. Access restored to external system applications. Make sure to complete your Wird target soon!');
    }
});
