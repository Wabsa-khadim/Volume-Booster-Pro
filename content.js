/**
 * Volume Booster Pro - Content Script
 * Intercepts all audio/video elements and applies Web Audio API gain boosting
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'vbp_settings';

  // State
  let audioContext = null;
  let gainNode = null;
  const mediaNodes = new WeakMap();
  let currentGain = 1.0;
  let isEnabled = true;
  let observer = null;

  // --- Audio Context & Gain Setup ---

  function getAudioContext() {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  }

  function getGainNode() {
    const ctx = getAudioContext();
    if (!gainNode || gainNode.context !== ctx) {
      gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
    }
    return gainNode;
  }

  function connectMedia(el) {
    if (mediaNodes.has(el)) return;
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaElementSource(el);
      const gain = getGainNode();
      source.connect(gain);
      mediaNodes.set(el, source);
      // Re-apply current gain
      applyGain(currentGain);
    } catch (e) {
      // Already connected or cross-origin
    }
  }

  function applyGain(value) {
    currentGain = value;
    if (gainNode) {
      gainNode.gain.setTargetAtTime(
        isEnabled ? value : 1.0,
        getAudioContext().currentTime,
        0.015
      );
    }
  }

  // --- DOM Scanning ---

  function processMediaElement(el) {
    if (el.tagName === 'AUDIO' || el.tagName === 'VIDEO') {
      // Hook play event to ensure context is resumed
      el.addEventListener('play', () => {
        connectMedia(el);
        applyGain(currentGain);
      }, { once: false });

      // If already playing
      if (!el.paused) {
        connectMedia(el);
        applyGain(currentGain);
      }
    }
  }

  function scanExistingMedia() {
    document.querySelectorAll('audio, video').forEach(processMediaElement);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            processMediaElement(node);
            node.querySelectorAll &&
              node.querySelectorAll('audio, video').forEach(processMediaElement);
          }
        });
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // --- Load Settings ---

  function loadSettings() {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const settings = result[STORAGE_KEY];
        const tabId = location.href;
        if (settings[tabId] !== undefined) {
          currentGain = settings[tabId].gain ?? 1.0;
          isEnabled = settings[tabId].enabled ?? true;
        }
      }
    });
  }

  // --- Message Listener ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SET_VOLUME') {
      currentGain = message.gain;
      isEnabled = message.enabled;
      applyGain(currentGain);
      sendResponse({ success: true });
    }

    if (message.type === 'GET_VOLUME') {
      sendResponse({ gain: currentGain, enabled: isEnabled });
    }

    if (message.type === 'PING') {
      sendResponse({ pong: true });
    }

    return true;
  });

  // --- Init ---

  function init() {
    loadSettings();
    scanExistingMedia();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
