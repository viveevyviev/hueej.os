/**
 * HUÊJ OS — System Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ================= FLOW STEP 1: IDENTITY SETUP ================= */
  const identityPhase = document.getElementById('phase-identity');
  const bootPhase = document.getElementById('phase-boot');
  const desktopPhase = document.getElementById('phase-desktop');
  const identityChoiceBtns = document.querySelectorAll('.identity-choice-btn');
  const identitySelectedTag = document.getElementById('identity-selected-tag');
  const progressFill = document.getElementById('boot-progress-fill');
  const welcomeAudio = document.getElementById('welcome-audio');

  let chosenIdentity = 'TUI ĐÂY BÀ';

  function proceedToBoot(identityName) {
    chosenIdentity = identityName.toUpperCase();
    if (identitySelectedTag) {
      identitySelectedTag.textContent = `CALIBRATED SPECTRUM: ${chosenIdentity}`;
    }
    if (welcomeAudio) {
      welcomeAudio.load();
    }
    switchPhase(identityPhase, bootPhase, () => {
      startBootSequence();
    });
  }

  identityChoiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      identityChoiceBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const selectedValue = btn.getAttribute('data-identity') || btn.textContent.trim();
      setTimeout(() => {
        proceedToBoot(selectedValue);
      }, 180);
    });
  });

  /* ================= FLOW STEP 2: BOOT SEQUENCE ================= */
  function startBootSequence() {
    let progress = 0;
    progressFill.style.width = '0%';

    const bootInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 6) + 3;

      if (progress >= 100) {
        progress = 100;
        clearInterval(bootInterval);
        progressFill.style.width = '100%';

        setTimeout(() => {
          switchPhase(bootPhase, desktopPhase, () => {
            triggerWelcomePopup();
          });
        }, 500);
      } else {
        progressFill.style.width = `${progress}%`;
      }
    }, 95);
  }

  /* ================= FLOW STEP 3: DESKTOP & WELCOME POP-UP ================= */
  const welcomeModal = document.getElementById('desktop-welcome-modal');
  const btnDismissWelcome = document.getElementById('btn-dismiss-welcome');
  const btnCloseWelcomeX = document.getElementById('btn-close-welcome-x');

  function triggerWelcomePopup() {
    if (welcomeModal) {
      welcomeModal.style.display = 'flex';
    }
    if (welcomeAudio) {
      welcomeAudio.currentTime = 0;
      welcomeAudio.play().catch(err => {
        console.warn('Audio autoplay waiting for user interaction:', err);
      });
    }
    initVideoPlayer();
  }

  function closeWelcomeModal() {
    if (welcomeModal) {
      welcomeModal.style.display = 'none';
    }
    const video = document.getElementById('hueej-main-video');
    if (video && video.paused) {
      video.play().catch(() => {});
    }
  }

  if (btnDismissWelcome) btnDismissWelcome.addEventListener('click', closeWelcomeModal);
  if (btnCloseWelcomeX) btnCloseWelcomeX.addEventListener('click', closeWelcomeModal);

  function switchPhase(current, next, callback) {
    current.style.opacity = '0';
    setTimeout(() => {
      current.classList.remove('active');
      current.style.display = 'none';

      next.style.display = 'flex';
      next.style.opacity = '0';
      next.classList.add('active');
      void next.offsetHeight;
      next.style.opacity = '1';

      if (callback) callback();
    }, 350);
  }

  /* ================= DIGITAL CLOCK ================= */
  const desktopTime = document.getElementById('desktop-time');
  const desktopAmpm = document.getElementById('desktop-ampm');
  const desktopDate = document.getElementById('desktop-date');

  function updateFigmaClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = String(hours).padStart(2, '0');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();

    if (desktopTime) desktopTime.textContent = `${formattedHours}:${minutes}`;
    if (desktopAmpm) desktopAmpm.textContent = ampm;
    if (desktopDate) desktopDate.textContent = `${dayName}, ${monthName} ${dateNum}`;
  }

  updateFigmaClock();
  setInterval(updateFigmaClock, 1000);

  /* ================= CONFLICT-FREE SCROLL ENGINE ================= */
  const stripWrapper = document.getElementById('gui-strip');

  function findScrollableParent(element) {
    let current = element;
    while (current && current !== stripWrapper && current !== document.body) {
      const style = window.getComputedStyle(current);
      const isOverflowY = style.overflowY === 'auto' || style.overflowY === 'scroll';
      const hasScrollableContent = current.scrollHeight > current.clientHeight;

      if (isOverflowY && hasScrollableContent) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  window.addEventListener('wheel', (evt) => {
    if (!desktopPhase || !desktopPhase.classList.contains('active')) return;
    if (document.querySelector('.figma-window.is-fullscreen')) return;

    const scrollableContainer = findScrollableParent(evt.target);

    if (scrollableContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableContainer;
      const delta = evt.deltaY;
      const isScrollingDown = delta > 0;
      const isScrollingUp = delta < 0;

      const canScrollDown = isScrollingDown && (scrollTop + clientHeight < scrollHeight - 1);
      const canScrollUp = isScrollingUp && (scrollTop > 1);

      if (canScrollDown || canScrollUp) {
        return;
      }
    }

    evt.preventDefault();
    stripWrapper.scrollLeft += evt.deltaY * 1.5;
  }, { passive: false });

  /* ================= DOUBLE-CLICK WINDOW TO CENTER ================= */
  const windows = document.querySelectorAll('.figma-window');

  windows.forEach((win) => {
    win.addEventListener('dblclick', (e) => {
      if (['BUTTON', 'INPUT', 'TEXTAREA', 'VIDEO', 'IFRAME'].includes(e.target.tagName)) return;
      if (e.target.closest('.finder-file-item')) return;
      if (e.target.closest('.media-sound-slider-wrap')) return;
      if (e.target.closest('.tt-direct-editable-stage')) return;

      win.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    });
  });

  /* ================= WINDOW CONTROLS ================= */
  const tray = document.getElementById('desktop-tray');

  windows.forEach((win) => {
    const btnHide = win.querySelector('.btn-hide');
    const btnFullscreen = win.querySelector('.btn-fullscreen');
    const btnClose = win.querySelector('.btn-close');
    const appName = win.getAttribute('data-app-name') || 'Cửa Sổ';

    if (btnHide) {
      btnHide.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.remove('is-fullscreen');
        win.classList.add('is-minimized');
        createRestorePill(win, appName);
      });
    }

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        const isFullscreen = win.classList.toggle('is-fullscreen');
        btnFullscreen.title = isFullscreen ? 'Thu nhỏ lại' : 'Toàn màn hình';
        if (!isFullscreen) {
          win.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.remove('is-fullscreen');
        win.classList.add('is-closed');
        createRestorePill(win, appName);
      });
    }
  });

  function createRestorePill(win, appName) {
    const existingPill = tray.querySelector(`[data-restore-id="${win.id}"]`);
    if (existingPill) return;

    const pill = document.createElement('button');
    pill.className = 'tray-restore-pill';
    pill.setAttribute('data-restore-id', win.id);
    pill.textContent = appName;

    pill.addEventListener('click', () => {
      win.classList.remove('is-minimized');
      win.classList.remove('is-closed');
      pill.remove();
      win.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });

    tray.appendChild(pill);
  }

  /* ================= WINDOW 2: CHIẾU LÊN ĐI EM CONTROLS ================= */
  const video = document.getElementById('hueej-main-video');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconMediaPlay = document.getElementById('icon-media-play');
  const iconMediaPause = document.getElementById('icon-media-pause');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnVolumeToggle = document.getElementById('btn-volume-toggle');
  const iconMediaMute = document.getElementById('icon-media-mute');
  const iconMediaUnmute = document.getElementById('icon-media-unmute');
  const soundSliderWrap = document.getElementById('media-sound-slider-wrap');
  const soundSliderPuck = document.getElementById('sound-slider-puck');
  const btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
  const scrubTrack = document.getElementById('video-scrub-track');
  const scrubThumb = document.getElementById('scrub-thumb');

  let previousVolume = 0.75;
  let isDraggingSound = false;

  function initVideoPlayer() {
    if (!video) return;
    updatePlayPauseUI();
    updateVolumeUI(video.muted ? 0 : video.volume);

    video.play().catch(() => {
      updatePlayPauseUI();
    });

    video.addEventListener('play', updatePlayPauseUI);
    video.addEventListener('pause', updatePlayPauseUI);

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const progressPercent = (video.currentTime / video.duration) * 100;
      if (scrubThumb) {
        scrubThumb.style.left = `${Math.min(progressPercent, 94)}%`;
      }
    });
  }

  function updatePlayPauseUI() {
    if (!video) return;
    if (video.paused) {
      if (iconMediaPlay) iconMediaPlay.style.display = 'block';
      if (iconMediaPause) iconMediaPause.style.display = 'none';
      if (btnPlayPause) btnPlayPause.title = 'Phát video';
    } else {
      if (iconMediaPlay) iconMediaPlay.style.display = 'none';
      if (iconMediaPause) iconMediaPause.style.display = 'block';
      if (btnPlayPause) btnPlayPause.title = 'Tạm dừng';
    }
  }

  if (btnPlayPause && video) {
    btnPlayPause.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
  }

  if (btnPrev && video) {
    btnPrev.addEventListener('click', () => {
      video.currentTime = Math.max(0, video.currentTime - 5);
    });
  }

  if (btnNext && video) {
    btnNext.addEventListener('click', () => {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
    });
  }

  function updateVolumeUI(vol) {
    if (!video) return;
    const isMuted = video.muted || vol <= 0.02;
    if (iconMediaMute && iconMediaUnmute) {
      iconMediaMute.style.display = isMuted ? 'block' : 'none';
      iconMediaUnmute.style.display = isMuted ? 'none' : 'block';
    }
    if (btnVolumeToggle) btnVolumeToggle.title = isMuted ? 'Bật tiếng' : 'Tắt tiếng';
    if (soundSliderPuck) {
      const minLeft = 10, maxLeft = 118;
      const currentLeft = minLeft + (maxLeft - minLeft) * (isMuted ? 0 : vol);
      soundSliderPuck.style.left = `${currentLeft}px`;
    }
  }

  if (btnVolumeToggle && video) {
    btnVolumeToggle.addEventListener('click', () => {
      if (video.muted || video.volume <= 0.02) {
        video.muted = false;
        video.volume = previousVolume > 0.05 ? previousVolume : 0.75;
      } else {
        previousVolume = video.volume;
        video.muted = true;
      }
      updateVolumeUI(video.muted ? 0 : video.volume);
    });
  }

  function handleSoundSlider(clientX) {
    if (!soundSliderWrap || !video) return;
    const rect = soundSliderWrap.getBoundingClientRect();
    const minX = rect.left + 10;
    const maxX = rect.left + 118;
    const clampedX = Math.min(Math.max(clientX, minX), maxX);
    const ratio = (clampedX - minX) / (maxX - minX);

    video.muted = false;
    video.volume = ratio;
    previousVolume = ratio;
    updateVolumeUI(ratio);
  }

  if (soundSliderWrap) {
    soundSliderWrap.addEventListener('mousedown', (e) => {
      isDraggingSound = true;
      handleSoundSlider(e.clientX);
    });
  }
  window.addEventListener('mousemove', (e) => {
    if (isDraggingSound) handleSoundSlider(e.clientX);
  });
  window.addEventListener('mouseup', () => { isDraggingSound = false; });

  if (btnFullscreenToggle && video) {
    btnFullscreenToggle.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (video.requestFullscreen) video.requestFullscreen();
      else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    });
  }

  if (scrubTrack && video) {
    scrubTrack.addEventListener('click', (e) => {
      const rect = scrubTrack.getBoundingClientRect();
      const clickPos = (e.clientX - rect.left) / rect.width;
      if (video.duration) video.currentTime = clickPos * video.duration;
    });
  }

  /* ================= WINDOW 3: TỦ KÍN ================= */
  const closetFilesContainer = document.getElementById('closet-files-container');
  const closetBtnBack = document.getElementById('closet-btn-back');
  const closetBtnForward = document.getElementById('closet-btn-forward');
  const closetCurrentPath = document.getElementById('closet-current-path');

  const closetFileSystem = {
    root: {
      path: 'Tủ kín /',
      items: [
        { id: 'item-1', name: 'VietPride 26.zip', icon: 'image/icon/unzip.svg', type: 'unzip' },
        { id: 'item-2', name: 'Images', icon: 'image/icon/zip.svg', type: 'folder', target: 'images' },
        { id: 'item-3', name: 'Media', icon: 'image/icon/zip.svg', type: 'folder', target: 'media' },
        { id: 'item-4', name: 'Am-I-A-Lesbian...', icon: 'image/icon/unzip.svg', type: 'unzip' }
      ]
    },
    images: {
      path: 'Tủ kín / Images /',
      items: [
        { id: 'img-1', name: 'ygibiteo.png', icon: 'image/icon/image.svg', type: 'file' },
        { id: 'img-2', name: 'bánh mì bê đê.png', icon: 'image/icon/image.svg', type: 'file' },
        { id: 'img-3', name: 'cây cút của anh.png', icon: 'image/icon/image.svg', type: 'file' },
        { id: 'img-4', name: 'chú voi con.png', icon: 'image/icon/image.svg', type: 'file' }
      ]
    },
    media: {
      path: 'Tủ kín / Media /',
      items: [
        { id: 'med-1', name: 'bung_l0n26.mp4', icon: 'image/icon/video.svg', type: 'file' },
        { id: 'med-2', name: 'toiladongtinhnu.txt', icon: 'image/icon/text.svg', type: 'file' },
        { id: 'med-3', name: 'queer(f).mp3', icon: 'image/icon/audio.svg', type: 'file' }
      ]
    }
  };

  let currentClosetFolder = 'root';
  let closetHistory = ['root'];
  let closetHistoryIndex = 0;

  function renderClosetFolder(folderKey) {
    if (!closetFilesContainer) return;
    closetFilesContainer.innerHTML = '';
    const folderData = closetFileSystem[folderKey] || closetFileSystem.root;
    currentClosetFolder = folderKey;
    if (closetCurrentPath) closetCurrentPath.textContent = folderData.path;

    folderData.items.forEach(file => {
      const fileEl = document.createElement('div');
      fileEl.className = 'finder-file-item';
      fileEl.innerHTML = `
        <div class="finder-icon-stage"><img src="${file.icon}" alt="${file.name}" class="finder-icon-graphic"></div>
        <div class="finder-item-label" title="${file.name}">${file.name}</div>
      `;

      fileEl.addEventListener('click', (e) => {
        e.stopPropagation();
        closetFilesContainer.querySelectorAll('.finder-file-item').forEach(el => el.classList.remove('is-selected'));
        fileEl.classList.add('is-selected');

        if (file.type === 'folder' && file.target) {
          setTimeout(() => { navigateToFolder(file.target); }, 120);
        } else if (file.type === 'unzip') {
          const img = fileEl.querySelector('.finder-icon-graphic');
          if (img) {
            img.style.transform = 'scale(1.15)';
            setTimeout(() => { img.style.transform = 'scale(1)'; }, 200);
          }
        }
      });

      closetFilesContainer.appendChild(fileEl);
    });

    if (closetBtnBack) closetBtnBack.disabled = (closetHistoryIndex <= 0);
    if (closetBtnForward) closetBtnForward.disabled = (closetHistoryIndex >= closetHistory.length - 1);
  }

  function navigateToFolder(targetKey) {
    closetHistory = closetHistory.slice(0, closetHistoryIndex + 1);
    closetHistory.push(targetKey);
    closetHistoryIndex = closetHistory.length - 1;
    renderClosetFolder(targetKey);
  }

  if (closetBtnBack) {
    closetBtnBack.addEventListener('click', () => {
      if (closetHistoryIndex > 0) {
        closetHistoryIndex--;
        renderClosetFolder(closetHistory[closetHistoryIndex]);
      }
    });
  }

  if (closetBtnForward) {
    closetBtnForward.addEventListener('click', () => {
      if (closetHistoryIndex < closetHistory.length - 1) {
        closetHistoryIndex++;
        renderClosetFolder(closetHistory[closetHistoryIndex]);
      }
    });
  }

  renderClosetFolder('root');

  /* ================= WINDOW 4: HUÊJ LEXICON ================= */
  const wordStream = document.getElementById('lexicon-word-stream');
  const giantLetterPreview = document.getElementById('giant-letter-preview');
  const alphabetGrid = document.getElementById('lexicon-alphabet-grid');
  const btnSurprise = document.getElementById('btn-surprise-word');
  const logoBtn = document.getElementById('lexicon-logo-btn');
  const btnFilterTab = document.getElementById('lex-btn-filter');
  const btnCollectionsTab = document.getElementById('lex-btn-collections');
  const btnSubmitTab = document.getElementById('lex-btn-submit');
  const filterDrawer = document.getElementById('sidebar-filter-drawer');
  const submitDrawer = document.getElementById('sidebar-submit-drawer');
  const collectionsDrawer = document.getElementById('sidebar-collections-drawer');
  const searchInput = document.getElementById('lex-search-input');
  const submitForm = document.getElementById('lexicon-submit-form');
  const collectionsSavedList = document.getElementById('collections-saved-list');

  let lexiconDatabase = [];
  let currentCategoryFilter = 'ALL';

  async function loadLexiconData() {
    try {
      const response = await fetch('hueej_lexicon_data.json');
      if (!response.ok) throw new Error();
      lexiconDatabase = await response.json();
    } catch {
      lexiconDatabase = [
        { id: 105, word: "Ăn lồn", alpha_key: "ă", pos_code: "ĐT", tag: "Homophobic", definitions: ["(1) Gặp chuyện không may.", "(2) Oral sex âm hộ."], examples: ['"Nó mà biết thì có mà ăn lồn!"'] },
        { id: 106, word: "Ăn chuối không lột vỏ", alpha_key: "ă", pos_code: "ĐT", tag: "Metaphor", definitions: ["Oral sex không kéo bao quy đầu hoặc đeo bao."], examples: ['"Thích ăn chuối bóc vỏ hay không lột vỏ?"'] }
      ];
    }
    renderLexiconList();
  }

  function renderLexiconList() {
    if (!wordStream) return;
    wordStream.innerHTML = '';
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = lexiconDatabase.filter(item => {
      const matchCat = (currentCategoryFilter === 'ALL') || (item.tag && item.tag.toLowerCase() === currentCategoryFilter.toLowerCase());
      const matchSearch = !searchTerm || item.word.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });

    filtered.forEach((item, index) => {
      const entryEl = document.createElement('div');
      entryEl.className = 'lex-entry-item';
      entryEl.innerHTML = `
        <div class="lex-entry-row">
          <div class="lex-col-no">(${item.id || index + 1})</div>
          <div class="lex-col-type">${item.pos_code || 'ĐT'}</div>
          <div class="lex-col-word">${item.word}</div>
          <div class="lex-col-tag">${item.tag || 'Queer'}</div>
        </div>
        <div class="lex-detail-body">
          ${(item.definitions || []).map(d => `<div class="lex-def-text">${d}</div>`).join('')}
          ${(item.examples || []).map(ex => `<div class="lex-example-text">Ví dụ: ${ex}</div>`).join('')}
        </div>
      `;

      entryEl.querySelector('.lex-entry-row').addEventListener('click', () => {
        entryEl.classList.toggle('is-expanded');
      });

      wordStream.appendChild(entryEl);
    });
  }

  function closeAllDrawers() {
    [filterDrawer, submitDrawer, collectionsDrawer].forEach(d => { if (d) d.classList.remove('is-open'); });
    [btnFilterTab, btnCollectionsTab, btnSubmitTab].forEach(b => { if (b) b.classList.remove('is-active'); });
  }

  function toggleDrawer(drawer, button) {
    const isOpen = drawer.classList.contains('is-open');
    closeAllDrawers();
    if (!isOpen) {
      drawer.classList.add('is-open');
      button.classList.add('is-active');
    }
  }

  if (btnFilterTab && filterDrawer) btnFilterTab.addEventListener('click', () => toggleDrawer(filterDrawer, btnFilterTab));
  if (btnCollectionsTab && collectionsDrawer) btnCollectionsTab.addEventListener('click', () => toggleDrawer(collectionsDrawer, btnCollectionsTab));
  if (btnSubmitTab && submitDrawer) btnSubmitTab.addEventListener('click', () => toggleDrawer(submitDrawer, btnSubmitTab));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeAllDrawers()));

  loadLexiconData();

  /* ==========================================================================
     WINDOW 6: CÙNG GÕ PHÔNG CHỮ HUEEJ!!! (DEDICATED CONTROLLER)
     ========================================================================== */
  const ttFontStyle = document.getElementById('tt-font-style');
  const ttTextInput = document.getElementById('tt-text-input');
  const ttDirectEditor = document.getElementById('tt-direct-editable-stage');
  const ttFontSize = document.getElementById('tt-font-size');
  const ttSizeBadge = document.getElementById('tt-size-badge');
  const ttSpacing = document.getElementById('tt-spacing');
  const ttSpacingBadge = document.getElementById('tt-spacing-badge');
  const ttLeading = document.getElementById('tt-leading');
  const ttLeadingBadge = document.getElementById('tt-leading-badge');
  const ttAlignGroup = document.getElementById('tt-align-group');
  const ttViewGroup = document.getElementById('tt-view-group');
  const ttCaseGroup = document.getElementById('tt-case-group');
  const ttOtGroup = document.getElementById('tt-ot-group');

  const ttTextColor = document.getElementById('tt-text-color');
  const ttTextColorHex = document.getElementById('tt-text-color-hex');
  const ttBgColor = document.getElementById('tt-bg-color');
  const ttBgColorHex = document.getElementById('tt-bg-color-hex');
  const ttBtnSwapColors = document.getElementById('tt-btn-swap-colors');

  const ttToggleNonRegular = document.getElementById('tt-toggle-nonregular');
  const ttWobbly = document.getElementById('tt-wobbly');
  const ttWobblyVal = document.getElementById('tt-wobbly-val');
  const ttChaotic = document.getElementById('tt-chaotic');
  const ttChaoticVal = document.getElementById('tt-chaotic-val');
  const ttVowel = document.getElementById('tt-vowel');
  const ttVowelVal = document.getElementById('tt-vowel-val');
  const ttFluid = document.getElementById('tt-fluid');
  const ttFluidVal = document.getElementById('tt-fluid-val');
  const ttJitter = document.getElementById('tt-jitter');
  const ttJitterVal = document.getElementById('tt-jitter-val');
  const ttCensor = document.getElementById('tt-censor');
  const ttCensorVal = document.getElementById('tt-censor-val');

  const ttToggleTypePath = document.getElementById('tt-toggle-typepath');
  const ttLoopRow = document.getElementById('tt-loop-row');
  const ttFlipRow = document.getElementById('tt-flip-row');
  const ttRibbon = document.getElementById('tt-ribbon');
  const ttRibbonVal = document.getElementById('tt-ribbon-val');
  const ttSmoothing = document.getElementById('tt-smoothing');
  const ttSmoothingVal = document.getElementById('tt-smoothing-val');
  const ttGuidesRow = document.getElementById('tt-guides-row');
  const ttBtnUndoPath = document.getElementById('tt-btn-undo-path');
  const ttBtnClearPath = document.getElementById('tt-btn-clear-path');

  const ttBtnFit = document.getElementById('tt-btn-fit');
  const ttExportSvg = document.getElementById('tt-export-svg');
  const ttExportPng = document.getElementById('tt-export-png');
  const ttFloatingToolbar = document.getElementById('tt-floating-toolbar');
  const ttVowelPickerDeck = document.getElementById('tt-vowel-picker-deck');
  const ttCanvasViewport = document.getElementById('tt-canvas-viewport');

  // Toàn bộ dữ liệu mẫu nguyên âm tiếng Việt từ file JSON
  const VOWEL_SAMPLES = {
    master: "Buổi chiều khuya, người nuôi hươu cười tươi ngoài khoai xoài. Người khuấy rượu, biếu người nhiều chuối, bưởi, khoai, xoài. Hươu xoay xoáy khuỷu, nguẩy đuôi. Người hiểu nhiều điều, yêu người yếu.",
    group_a: "Ngày mai, hai cậu cháu ta lại vào đài. Cậu bảo cháu thấy máy cháy. Cháu thấy màu máu chảy ra tay. Hai cậu cháu mau mau lấy dầu máy tra vào. Sau đấy, tàu chạy mau lại cầu dài.",
    group_e: "Mèo béo trèo đèo, leo lều. Tễu khéo trêu mèo, đẽo keo, đeo kéo. Kẻo nghèo, đều kêu mếu. Chèo lều, thêu bèo, xèo xèo.",
    group_i: "Kìa, chị kia đi kiệu. Khi chiều, dì níu chị, dì xỉu. Chị dìu dì đi phía địa kia. Chị hiểu nhiều điều nghĩa, trị nhiễu điều. Vì chị thiếu chi tiêu, chị biếu dì nhiều phiếu. Dì chịu, dì dịu đi.",
    group_o: "Ngoại gọi tôi tới kho. Tôi ngồi đợi ngoài cội đồi. Voi ngoi ngoài đồi, gọi ngoao ngoao. Trời mới tối, tôi xoay xoáy cởi gói khoai xoài. Đóa hoa lóe xòe khỏe. Ngoại hỏi: «Mời tôi gói khoai xoài với!»",
    group_u: "Buổi khuya, người dưới quê cưỡi ngựa qua chùa. Người mua chuối, bưởi, dừa, lúa, lụa, muối. Mưa, người quỳ dưới cửa chùa, khuấy rượu quế sưởi. Người cười tươi, vui vẻ nuôi hươu, cừu. Vua quý người, mua lụa, sữa, chuối, bưởi chứa dưới túi.",
    group_y: "Yêu yếu yêu yêu yểu. Yêu yểu yêu yêu yếu. Yêu yếu, yêu yểu: «Yê! Yêu! Yêu!» Yêu yếu yếu, yêu yểu yểu, yêu yêu yếu yểu."
  };

  // MẶC ĐỊNH KHI MỞ: CẢ 2 TOOL ĐỀU TẮT (OFF)
  let nonRegularActive = false;
  let typePathActive = false;

  let currentActiveFontKey = 'regular';
  let ttTextCase = 'none';
  let ttTextAlign = 'left';
  let ttViewMode = 'custom';
  let ttLoopText = false;
  let ttFlipOrientation = false;
  let ttShowGuides = false;
  let otFeaturesMap = { liga: true, dlig: false, calt: true, kern: true };

  let typePathStrokes = [];
  let currentStroke = null;
  let currentSelectedRange = null;

  // Thu gọn / mở rộng Card
  document.querySelectorAll('.tt-card-header[data-toggle]').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const card = hdr.closest('.tt-card');
      card.classList.toggle('is-collapsed');
    });
  });

  // ĐỒNG BỘ 2 TOOL LOẠI TRỪ LẪN NHAU (NẾU BẬT 1 CÁI THÌ CÁI KIA TỰ TẮT ĐỂ TRÁNH XUNG ĐỘT)
  function syncToolMode() {
    const canvasWrap = document.getElementById('tt-p5-canvas-wrap');
    
    if (typePathActive) {
      // Khi bật Type Path: Bật Canvas vẽ, tắt gõ trên Preview
      if (canvasWrap) canvasWrap.classList.add('active-drawing');
      if (ttDirectEditor) {
        ttDirectEditor.style.display = 'none';
      }
      if (ttFloatingToolbar) ttFloatingToolbar.style.display = 'none';
    } else {
      // Khi tắt Type Path: Cho phép soạn thảo & bôi đen trên Preview
      if (canvasWrap) canvasWrap.classList.remove('active-drawing');
      if (ttDirectEditor) {
        ttDirectEditor.style.display = 'block';
      }
    }
    syncEditorTypography();
  }

  if (ttToggleNonRegular) {
    ttToggleNonRegular.addEventListener('click', () => {
      if (!nonRegularActive) {
        nonRegularActive = true;
        ttToggleNonRegular.classList.replace('is-off', 'is-on');
        // Tự động tắt Type Path nếu đang mở
        if (typePathActive) {
          typePathActive = false;
          ttToggleTypePath.classList.replace('is-on', 'is-off');
        }
      } else {
        nonRegularActive = false;
        ttToggleNonRegular.classList.replace('is-on', 'is-off');
      }
      syncToolMode();
    });
  }

  if (ttToggleTypePath) {
    ttToggleTypePath.addEventListener('click', () => {
      if (!typePathActive) {
        typePathActive = true;
        ttToggleTypePath.classList.replace('is-off', 'is-on');
        // Tự động tắt nonRegular nếu đang mở
        if (nonRegularActive) {
          nonRegularActive = false;
          ttToggleNonRegular.classList.replace('is-on', 'is-off');
        }
      } else {
        typePathActive = false;
        ttToggleTypePath.classList.replace('is-on', 'is-off');
      }
      syncToolMode();
    });
  }

  // Đồng bộ văn bản 2 chiều giữa ô nhập liệu và khung Preview
  if (ttTextInput && ttDirectEditor) {
    ttTextInput.addEventListener('input', () => {
      ttDirectEditor.innerText = ttTextInput.value;
    });

    ttDirectEditor.addEventListener('input', () => {
      ttTextInput.value = ttDirectEditor.innerText;
    });
  }

  // Đồng bộ các thuộc tính Typography và hiệu ứng nonRegular
  function syncEditorTypography() {
    if (!ttDirectEditor) return;
    const fontSize = ttFontSize ? ttFontSize.value : 48;
    const spacing = ttSpacing ? ttSpacing.value : 0;
    const leading = ttLeading ? ttLeading.value : 1.45;
    const textColor = ttTextColor ? ttTextColor.value : '#B500FF';
    const bgColor = ttBgColor ? ttBgColor.value : '#FFFFFF';

    ttDirectEditor.style.fontSize = `${fontSize}px`;
    ttDirectEditor.style.letterSpacing = `${spacing}px`;
    ttDirectEditor.style.lineHeight = leading;
    ttDirectEditor.style.color = textColor;
    ttDirectEditor.style.textAlign = ttTextAlign;
    ttDirectEditor.style.fontFamily = (currentActiveFontKey === 'nonRegular' || nonRegularActive) ? 'var(--font-display)' : 'var(--font-body)';
    
    if (ttCanvasViewport) {
      ttCanvasViewport.style.backgroundColor = bgColor;
    }

    // Text Case
    let text = ttTextInput.value;
    if (ttTextCase === 'lower') text = text.toLowerCase();
    else if (ttTextCase === 'upper') text = text.toUpperCase();
    else if (ttTextCase === 'cap') text = text.replace(/\b\w/g, c => c.toUpperCase());
    
    // Nếu không có span hiệu ứng đặc biệt thì cập nhật text
    if (!ttDirectEditor.querySelector('.slang-token')) {
      ttDirectEditor.innerText = text;
    }

    // OpenType features
    let otString = `"liga" ${otFeaturesMap.liga ? 1 : 0}, "calt" ${otFeaturesMap.calt ? 1 : 0}, "dlig" ${otFeaturesMap.dlig ? 1 : 0}, "kern" ${otFeaturesMap.kern ? 1 : 0}`;
    ttDirectEditor.style.fontFeatureSettings = otString;
  }

  // Sliders binding
  function bindSlider(slider, badge, unit = '') {
    if (!slider || !badge) return;
    slider.addEventListener('input', () => {
      badge.textContent = `${slider.value}${unit}`;
      syncEditorTypography();
    });
  }
  bindSlider(ttFontSize, ttSizeBadge, 'px');
  bindSlider(ttSpacing, ttSpacingBadge, 'px');
  bindSlider(ttLeading, ttLeadingBadge, '');
  bindSlider(ttWobbly, ttWobblyVal, 'pt');
  bindSlider(ttChaotic, ttChaoticVal, 'pt');
  bindSlider(ttVowel, ttVowelVal, '');
  bindSlider(ttFluid, ttFluidVal, 'pt');
  bindSlider(ttJitter, ttJitterVal, 'pt');
  bindSlider(ttCensor, ttCensorVal, 'pt');
  bindSlider(ttRibbon, ttRibbonVal, '');
  bindSlider(ttSmoothing, ttSmoothingVal, '');

  // Checkboxes
  function bindCheck(row, setter) {
    if (!row) return;
    row.addEventListener('click', () => {
      const isChecked = row.classList.toggle('is-checked');
      setter(isChecked);
    });
  }
  bindCheck(ttLoopRow, v => { ttLoopText = v; });
  bindCheck(ttFlipRow, v => { ttFlipOrientation = v; });
  bindCheck(ttGuidesRow, v => { ttShowGuides = v; });

  // Alignment
  if (ttAlignGroup) {
    ttAlignGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tt-seg-btn');
      if (!btn) return;
      ttAlignGroup.querySelectorAll('.tt-seg-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      ttTextAlign = btn.dataset.align;
      syncEditorTypography();
    });
  }

  // View (Custom vs Sample) & Selector cho các nhóm nguyên âm tiếng Việt
  if (ttViewGroup) {
    ttViewGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tt-seg-btn');
      if (!btn) return;
      ttViewGroup.querySelectorAll('.tt-seg-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      ttViewMode = btn.dataset.view;

      if (ttViewMode === 'sample') {
        if (ttVowelPickerDeck) ttVowelPickerDeck.style.display = 'flex';
        ttTextInput.value = VOWEL_SAMPLES.master;
        syncEditorTypography();
      } else {
        if (ttVowelPickerDeck) ttVowelPickerDeck.style.display = 'none';
        ttTextInput.value = "Chị em bé đẻ, mấy má ơi! Địt mẹ lũ xàm lồn, xạo lone! Bóng lộn dị biệt, bê đê. Bàn lộn cá chả bạc.";
        syncEditorTypography();
      }
    });
  }

  if (ttVowelPickerDeck) {
    ttVowelPickerDeck.addEventListener('click', (e) => {
      const pill = e.target.closest('.tt-vowel-pill');
      if (!pill) return;
      ttVowelPickerDeck.querySelectorAll('.tt-vowel-pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      const vKey = pill.dataset.vgroup;
      if (VOWEL_SAMPLES[vKey]) {
        ttTextInput.value = VOWEL_SAMPLES[vKey];
        syncEditorTypography();
      }
    });
  }

  // Text Case
  if (ttCaseGroup) {
    ttCaseGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tt-seg-btn');
      if (!btn) return;
      ttCaseGroup.querySelectorAll('.tt-seg-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      ttTextCase = btn.dataset.case;
      syncEditorTypography();
    });
  }

  // OpenType Features
  if (ttOtGroup) {
    ttOtGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tt-seg-btn');
      if (!btn) return;
      const feat = btn.dataset.ot;
      otFeaturesMap[feat] = !otFeaturesMap[feat];
      btn.classList.toggle('is-active', otFeaturesMap[feat]);
      syncEditorTypography();
    });
  }

  // Màu sắc & Đảo màu
  if (ttTextColor && ttTextColorHex) {
    ttTextColor.addEventListener('input', () => {
      ttTextColorHex.value = ttTextColor.value.toUpperCase();
      syncEditorTypography();
    });
    ttTextColorHex.addEventListener('input', () => {
      ttTextColor.value = ttTextColorHex.value;
      syncEditorTypography();
    });
  }

  if (ttBgColor && ttBgColorHex) {
    ttBgColor.addEventListener('input', () => {
      ttBgColorHex.value = ttBgColor.value.toUpperCase();
      syncEditorTypography();
    });
    ttBgColorHex.addEventListener('input', () => {
      ttBgColor.value = ttBgColorHex.value;
      syncEditorTypography();
    });
  }

  if (ttBtnSwapColors) {
    ttBtnSwapColors.addEventListener('click', () => {
      const temp = ttTextColor.value;
      ttTextColor.value = ttBgColor.value;
      ttTextColorHex.value = ttBgColor.value.toUpperCase();
      ttBgColor.value = temp;
      ttBgColorHex.value = temp.toUpperCase();
      syncEditorTypography();
    });
  }

  if (ttFontStyle) {
    ttFontStyle.addEventListener('change', () => {
      currentActiveFontKey = ttFontStyle.value;
      syncEditorTypography();
    });
  }

  // Nút FIT: Tự động tính cỡ chữ để vừa trọn khung Preview
  if (ttBtnFit && ttCanvasViewport && ttFontSize) {
    ttBtnFit.addEventListener('click', () => {
      const textLen = (ttDirectEditor ? ttDirectEditor.innerText.length : 100);
      const viewW = ttCanvasViewport.clientWidth - 80;
      const viewH = ttCanvasViewport.clientHeight - 60;
      
      const approxArea = viewW * viewH;
      const optimalSize = Math.max(20, Math.min(64, Math.floor(Math.sqrt(approxArea / textLen) * 0.72)));
      
      ttFontSize.value = optimalSize;
      if (ttSizeBadge) ttSizeBadge.textContent = `${optimalSize}px`;
      syncEditorTypography();
      ttCanvasViewport.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ================= BÔI ĐEN & POPUP HIỆU ỨNG (CHỐNG CHE VÀ CHỈ HIỆN KHI BẬT TOOL) =================
  function updateFloatingToolbar() {
    // Chỉ hiển thị popup nếu nonRegular Tool đang BẬT
    if (!nonRegularActive) {
      if (ttFloatingToolbar) ttFloatingToolbar.style.display = 'none';
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !ttDirectEditor) {
      if (ttFloatingToolbar) ttFloatingToolbar.style.display = 'none';
      return;
    }

    const range = sel.getRangeAt(0);
    if (!ttDirectEditor.contains(range.commonAncestorContainer)) {
      if (ttFloatingToolbar) ttFloatingToolbar.style.display = 'none';
      return;
    }

    currentSelectedRange = range;
    const rect = range.getBoundingClientRect();
    const containerRect = ttCanvasViewport.getBoundingClientRect();

    if (ttFloatingToolbar) {
      ttFloatingToolbar.style.display = 'flex';
      
      const offsetFromTop = rect.top - containerRect.top;
      
      // NẾU CHỌN Ở DÒNG ĐẦU TIÊN (SÁT MÉP TRÊN < 70PX): TỰ ĐỘNG LẬT XUỐNG DƯỚI DÒNG CHỮ
      if (offsetFromTop < 70) {
        ttFloatingToolbar.style.top = `${rect.bottom - containerRect.top + ttCanvasViewport.scrollTop + 10}px`;
        ttFloatingToolbar.style.transform = 'translate(-50%, 0)';
      } else {
        // NẰM PHÍA TRÊN DÒNG CHỮ NHƯ BÌNH THƯỜNG
        ttFloatingToolbar.style.top = `${rect.top - containerRect.top + ttCanvasViewport.scrollTop - 10}px`;
        ttFloatingToolbar.style.transform = 'translate(-50%, -100%)';
      }

      // Giữ thanh popup luôn nằm bên trong chiều rộng của khung xem
      let left = rect.left - containerRect.left + ttCanvasViewport.scrollLeft + (rect.width / 2);
      const minLeft = 140;
      const maxLeft = ttCanvasViewport.scrollWidth - 140;
      left = Math.max(minLeft, Math.min(left, maxLeft));
      ttFloatingToolbar.style.left = `${left}px`;
    }
  }

  document.addEventListener('selectionchange', updateFloatingToolbar);
  if (ttCanvasViewport) ttCanvasViewport.addEventListener('scroll', updateFloatingToolbar);

  // Áp dụng hiệu ứng sinh động trực tiếp lên chữ
  function applySlangEffect(effectType) {
    if (!currentSelectedRange) return;
    const selectedText = currentSelectedRange.toString();
    if (!selectedText) return;

    let swapText = "";
    if (effectType === 'noilai') {
      swapText = prompt(`Nhập từ Nói Lái đối ứng cho "${selectedText}":`, selectedText.split(' ').reverse().join(' '));
      if (!swapText) return;
    }

    if (effectType === 'clear') {
      const textNode = document.createTextNode(selectedText);
      currentSelectedRange.deleteContents();
      currentSelectedRange.insertNode(textNode);
    } else {
      const span = document.createElement('span');
      span.className = `slang-token slang-${effectType}`;
      span.dataset.effect = effectType;
      if (swapText) {
        span.dataset.swap = swapText;
        span.dataset.orig = selectedText;
        span.addEventListener('mouseenter', () => { span.textContent = swapText; });
        span.addEventListener('mouseleave', () => { span.textContent = span.dataset.orig; });
      }
      span.textContent = selectedText;

      currentSelectedRange.deleteContents();
      currentSelectedRange.insertNode(span);
    }

    if (ttFloatingToolbar) ttFloatingToolbar.style.display = 'none';
  }

  document.getElementById('tt-ft-taboo').addEventListener('click', (e) => { e.preventDefault(); applySlangEffect('taboo'); });
  document.getElementById('tt-ft-homo').addEventListener('click', (e) => { e.preventDefault(); applySlangEffect('homo'); });
  document.getElementById('tt-ft-fem').addEventListener('click', (e) => { e.preventDefault(); applySlangEffect('fem'); });
  document.getElementById('tt-ft-noilai').addEventListener('click', (e) => { e.preventDefault(); applySlangEffect('noilai'); });
  document.getElementById('tt-ft-clear').addEventListener('click', (e) => { e.preventDefault(); applySlangEffect('clear'); });

  // ================= P5.JS SKETCH: TYPE PATH TOOL =================
  const typePathSketch = (p) => {
    p.setup = () => {
      const parent = document.getElementById('tt-p5-canvas-wrap');
      const w = parent ? parent.clientWidth : 750;
      const h = parent ? parent.clientHeight : 850;
      const cnv = p.createCanvas(w, h);
      cnv.parent('tt-p5-canvas-wrap');
      p.noLoop();
    };

    p.draw = () => {
      p.clear();
      if (!typePathActive) return;

      const strokesToDraw = [...typePathStrokes];
      if (currentStroke && currentStroke.points.length > 1) {
        strokesToDraw.push(currentStroke);
      }

      for (const stroke of strokesToDraw) {
        let pts = stroke.points;
        if (ttFlipOrientation) pts = [...pts].reverse();
        if (pts.length < 2) continue;

        if (ttShowGuides) {
          p.push();
          p.noFill();
          p.stroke(181, 0, 255, 130);
          p.strokeWeight(1.5);
          p.beginShape();
          for (let pt of pts) p.vertex(pt.x, pt.y);
          p.endShape();
          p.pop();
        }

        // Lấy chữ trực tiếp từ ô nhập bên trái
        const text = ttTextInput.value || "huêj";
        const fontSize = parseFloat(ttFontSize.value) || 36;
        const ribbons = parseInt(ttRibbon.value) || 1;

        p.push();
        p.fill(ttTextColor.value || '#B500FF');
        p.noStroke();
        p.textSize(fontSize);
        p.textFont((currentActiveFontKey === 'nonRegular') ? 'Hueej-nonRegular' : 'Hueej-Regular');

        for (let r = 0; r < ribbons; r++) {
          const ribbonOffset = (r - (ribbons - 1) / 2) * (fontSize * 0.85);
          for (let i = 0; i < pts.length; i += 6) {
            const pt = pts[i];
            const char = text[Math.floor(i / 6) % text.length];
            p.text(char, pt.x, pt.y + ribbonOffset);
          }
        }
        p.pop();
      }
    };

    p.mousePressed = () => {
      if (!typePathActive) return;
      if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
      currentStroke = { points: [{ x: p.mouseX, y: p.mouseY }] };
      p.redraw();
    };

    p.mouseDragged = () => {
      if (!typePathActive || !currentStroke) return;
      currentStroke.points.push({ x: p.mouseX, y: p.mouseY });
      p.redraw();
    };

    p.mouseReleased = () => {
      if (typePathActive && currentStroke && currentStroke.points.length > 1) {
        typePathStrokes.push(currentStroke);
      }
      currentStroke = null;
      p.redraw();
    };
  };

  const p5Instance = new p5(typePathSketch, 'tt-p5-canvas-wrap');

  if (ttBtnUndoPath) {
    ttBtnUndoPath.addEventListener('click', () => {
      typePathStrokes.pop();
      if (p5Instance) p5Instance.redraw();
    });
  }

  if (ttBtnClearPath) {
    ttBtnClearPath.addEventListener('click', () => {
      typePathStrokes = [];
      if (p5Instance) p5Instance.redraw();
    });
  }

  // Export
  if (ttExportPng) {
    ttExportPng.addEventListener('click', () => {
      alert("Đã xuất hình ảnh mẫu phông chữ Huêj dạng PNG!");
    });
  }

  if (ttExportSvg) {
    ttExportSvg.addEventListener('click', () => {
      alert("Đã xuất bản vẽ vector phông chữ Huêj dạng SVG!");
    });
  }

  // Khởi động đồng bộ ban đầu
  syncEditorTypography();
  syncToolMode();
});