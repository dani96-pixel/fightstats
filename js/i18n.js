// i18n.js — Internationalization engine for FightStats
// Detects browser language, loads translations, provides t() helper

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';

let currentLang = DEFAULT_LANG;
let translations = {};
let langReady = false;
let langReadyCallbacks = [];

// ─────────────────────────────────────────────
// DETECTION & INITIALIZATION
// ─────────────────────────────────────────────

function detectLanguage() {
  // 1. Check saved preference
  try {
    const saved = localStorage.getItem('fs-lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (e) { /* localStorage not available */ }

  // 2. Check browser language
  const browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

  // 3. Default
  return DEFAULT_LANG;
}

async function initI18n() {
  const lang = detectLanguage();
  await loadLanguage(lang);
}

async function loadLanguage(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`);
    if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
    translations = await res.json();
    currentLang = lang;
    document.documentElement.lang = lang;

    try { localStorage.setItem('fs-lang', lang); } catch (e) { /* ok */ }

    applyStaticTranslations();
    updateLangSelector();
    langReady = true;
    langReadyCallbacks.forEach(cb => cb());
    langReadyCallbacks = [];
  } catch (err) {
    console.error('i18n: failed to load language', lang, err);
    // Fallback: if we tried English and failed, try Spanish
    if (lang !== DEFAULT_LANG) {
      await loadLanguage(DEFAULT_LANG);
    }
  }
}

// ─────────────────────────────────────────────
// TRANSLATION HELPERS
// ─────────────────────────────────────────────

/**
 * Get translated string by key.
 * Supports simple interpolation: t('key', { count: 5 }) replaces {count} in the string.
 */
function t(key, params) {
  let str = translations[key];
  if (str === undefined) return key;
  if (params) {
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
  }
  return str;
}

function getLang() {
  return currentLang;
}

/**
 * Returns the localized data path.
 * e.g. "data/events/ufc-326.json" → "data/en/events/ufc-326.json"
 *      "data/stats.json" → "data/en/stats.json"
 */
function localizeDataPath(path) {
  return path.replace(/^data\//, `data/${currentLang}/`);
}

/**
 * Get locale string for date formatting.
 */
function getDateLocale() {
  return currentLang === 'es' ? 'es-ES' : 'en-US';
}

function onLangReady(cb) {
  if (langReady) cb();
  else langReadyCallbacks.push(cb);
}

// ─────────────────────────────────────────────
// DOM TRANSLATION (static elements)
// ─────────────────────────────────────────────

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val === key) return; // no translation found

    const attr = el.dataset.i18nAttr;
    if (attr) {
      el.setAttribute(attr, val);
    } else {
      el.innerHTML = val;
    }
  });

  // Update meta description
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('meta_description'));

  // Update page title
  document.title = t('site_title');
}

// ─────────────────────────────────────────────
// LANGUAGE SELECTOR
// ─────────────────────────────────────────────

function updateLangSelector() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

async function switchLanguage(lang) {
  if (lang === currentLang) return;
  await loadLanguage(lang);
  // Re-render current page content
  if (typeof router === 'function') router();
}

// ─────────────────────────────────────────────
// AUTO-INIT
// ─────────────────────────────────────────────
// initI18n() is called from the DOMContentLoaded handler in main.js
