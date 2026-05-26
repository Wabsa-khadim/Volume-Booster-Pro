/**
 * Volume Booster Pro — Popup Script
 * Handles UI interactions and communicates with content script
 */

'use strict';

// ── Constants ────────────────────────────────────────────
const MIN_VOL = 0;
const MAX_VOL = 600;
const STORAGE_KEY = 'vbp_settings';

// Arc parameters (SVG dial)
const ARC_RADIUS = 80;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
const ARC_START_ANGLE = -220; // degrees (from rotate on SVG)
const ARC_TOTAL_DEGREES = 260; // total sweep in degrees

// ── DOM Refs ─────────────────────────────────────────────
const powerToggle    = document.getElementById('powerToggle');
const volumeSlider   = document.getElementById('volumeSlider');
const sliderFill     = document.getElementById('sliderFill');
const volumeValue    = document.getElementById('volumeValue');
const volumeLabel    = document.getElementById('volumeLabel');
const dialArc        = document.getElementById('dialArc');
const dialGlow       = document.getElementById('dialGlow');
const siteName       = document.getElementById('siteName');
const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const visualizer     = document.getElementById('visualizer');
const appEl          = document.querySelector('.app');
const presetPills    = document.querySelectorAll('.preset-pill');
const siteFavicon    = document.getElementById('siteFavicon');

// Inject tick marks around the arc for a premium gauge look
(function renderTickMarks() {
  const tickGroup = document.getElementById('tickMarks');
  if (!tickGroup) return;
  const cx = 100, cy = 100, r = 80;
  const startDeg = -220;
  const totalDeg = 260;
  const numTicks = 13;

  for (let i = 0; i <= numTicks; i++) {
    const angle = startDeg + (totalDeg / numTicks) * i;
    const rad = (angle * Math.PI) / 180;
    const isLarge = i % (numTicks / 4) === 0;
    const innerR = r + (isLarge ? 10 : 7);
    const outerR = r + (isLarge ? 17 : 13);
    const x1 = cx + innerR * Math.cos(rad);
    const y1 = cy + innerR * Math.sin(rad);
    const x2 = cx + outerR * Math.cos(rad);
    const y2 = cy + outerR * Math.sin(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toFixed(2));
    line.setAttribute('y1', y1.toFixed(2));
    line.setAttribute('x2', x2.toFixed(2));
    line.setAttribute('y2', y2.toFixed(2));
    line.setAttribute('stroke', isLarge ? '#BEC3CC' : '#CDD1D9');
    line.setAttribute('stroke-width', isLarge ? '2' : '1.2');
    line.setAttribute('stroke-linecap', 'round');
    tickGroup.appendChild(line);
  }
})();


// ── State ────────────────────────────────────────────────
let state = {
  volume: 100,   // percentage (100 = normal, 600 = 6x)
  enabled: true,
  tabId: null,
  tabUrl: '',
};

// ── Helpers ──────────────────────────────────────────────

function gainFromPercent(pct) {
  return pct / 100;
}

function getLabelForVolume(v) {
  if (!state.enabled) return 'Off';
  if (v === 0)   return 'Muted';
  if (v <= 100)  return 'Normal';
  if (v <= 200)  return 'Boosted';
  if (v <= 350)  return 'Loud';
  if (v <= 500)  return 'Very Loud';
  return 'Max Power';
}

function getGradientForVolume(v) {
  if (v <= 100) return 'linear-gradient(135deg, #A855F7, #EC4899)';
  if (v <= 200) return 'linear-gradient(135deg, #818CF8, #A855F7)';
  if (v <= 350) return 'linear-gradient(135deg, #06B6D4, #818CF8)';
  if (v <= 500) return 'linear-gradient(135deg, #FB923C, #F43F5E)';
  return 'linear-gradient(135deg, #EF4444, #7C3AED)';
}

// ── Dial Arc Update ──────────────────────────────────────

function updateDial(pct) {
  // Arc sweeps ARC_TOTAL_DEGREES degrees for 0–MAX_VOL
  const fraction = Math.min(pct / MAX_VOL, 1);
  const arcLength = ARC_CIRCUMFERENCE * (ARC_TOTAL_DEGREES / 360) * fraction;
  const dashOffset = ARC_CIRCUMFERENCE - arcLength;

  dialArc.style.strokeDashoffset = dashOffset;
  dialGlow.style.strokeDashoffset = dashOffset;

  // Update stroke for boosted colors
  const grad = pct > 100 ? 'url(#arcGradient)' : 'url(#arcGradient)';
  dialArc.setAttribute('stroke', grad);
}

// ── Slider Fill ──────────────────────────────────────────

function updateSliderFill(pct) {
  const fraction = (pct - MIN_VOL) / (MAX_VOL - MIN_VOL);
  const trackWidth = sliderFill.parentElement.clientWidth - 8; // minus padding
  const fillWidth = fraction * trackWidth;
  sliderFill.style.width = Math.max(0, fillWidth) + 'px';

  // Dynamic color
  if (pct <= 100) {
    sliderFill.style.background = 'linear-gradient(90deg, #A855F7, #EC4899)';
  } else if (pct <= 300) {
    sliderFill.style.background = 'linear-gradient(90deg, #818CF8, #A855F7, #EC4899)';
  } else {
    sliderFill.style.background = 'linear-gradient(90deg, #06B6D4, #818CF8, #EC4899)';
  }
}

// ── Preset Pills ─────────────────────────────────────────

function updatePresets(pct) {
  presetPills.forEach(pill => {
    const val = parseInt(pill.dataset.value, 10);
    pill.classList.toggle('active', val === pct);
  });
}

// ── UI Full Update ───────────────────────────────────────

function updateUI(animate = false) {
  const v = state.volume;
  const en = state.enabled;

  // Value + label
  volumeValue.textContent = v;
  volumeLabel.textContent = getLabelForVolume(v);

  if (animate) {
    volumeValue.classList.remove('pop');
    void volumeValue.offsetWidth; // reflow
    volumeValue.classList.add('pop');
  }

  // Dial
  updateDial(en ? v : 0);

  // Slider fill
  volumeSlider.value = v;
  updateSliderFill(en ? v : 0);

  // Presets
  updatePresets(v);

  // App disabled class
  appEl.classList.toggle('disabled', !en);

  // Visualizer
  visualizer.classList.toggle('boosted', en && v > 200);
  visualizer.classList.toggle('off', !en);

  // Status
  statusDot.classList.toggle('active', en);
  statusText.textContent = en ? 'Active' : 'Off';
  statusText.classList.toggle('inactive', !en);
}

// ── Send to Content Script ───────────────────────────────

async function sendVolumeToTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const gain = gainFromPercent(state.enabled ? state.volume : 100);

    await chrome.tabs.sendMessage(tab.id, {
      type: 'SET_VOLUME',
      gain: gainFromPercent(state.enabled ? state.volume : 100),
      enabled: state.enabled,
    }).catch(() => {
      // Content script may not be injected yet; try scripting API
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SET_VOLUME',
          gain,
          enabled: state.enabled,
        });
      }).catch(() => {});
    });
  } catch (e) {}
}

// ── Save/Load ────────────────────────────────────────────

function saveSettings() {
  const data = { volume: state.volume, enabled: state.enabled };
  chrome.storage.local.set({ [STORAGE_KEY]: data });
}

function loadSettings(cb) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    if (result[STORAGE_KEY]) {
      const s = result[STORAGE_KEY];
      state.volume = s.volume ?? 100;
      state.enabled = s.enabled ?? true;
    }
    cb && cb();
  });
}

// ── Tab Info ─────────────────────────────────────────────

async function loadTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    state.tabId = tab.id;
    state.tabUrl = tab.url || '';

    // Site name
    let host = '';
    try {
      host = new URL(tab.url).hostname.replace('www.', '');
    } catch {}
    siteName.textContent = host || 'Unknown site';

    // Favicon
    if (tab.favIconUrl) {
      siteFavicon.innerHTML = '';
      const img = document.createElement('img');
      img.src = tab.favIconUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '4px';
      img.onerror = () => {
        siteFavicon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#A855F7" stroke-width="2"/>
          <path d="M12 8v4l3 3" stroke="#A855F7" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      };
      siteFavicon.appendChild(img);
    }
  } catch (e) {}
}

// ── Event Handlers ───────────────────────────────────────

// Slider
volumeSlider.addEventListener('input', (e) => {
  state.volume = parseInt(e.target.value, 10);
  updateUI(false);
  sendVolumeToTab();
  saveSettings();
});

volumeSlider.addEventListener('change', () => {
  updateUI(true);
});

// Power toggle
powerToggle.addEventListener('change', () => {
  state.enabled = powerToggle.checked;
  updateUI(true);
  sendVolumeToTab();
  saveSettings();
});

// Preset pills
presetPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const val = parseInt(pill.dataset.value, 10);
    state.volume = val;
    if (!state.enabled) {
      state.enabled = true;
      powerToggle.checked = true;
    }
    updateUI(true);
    sendVolumeToTab();
    saveSettings();
  });
});

// ── Dial drag (optional touch-friendly radial knob) ──────
// Not included to keep it clean – slider is the primary control

// ── Init ─────────────────────────────────────────────────

async function init() {
  await loadTabInfo();
  loadSettings(() => {
    powerToggle.checked = state.enabled;
    updateUI(false);
    sendVolumeToTab();
  });
}

init();
