import React, { useState, useEffect } from 'react';

// Realtime Zia Translation Utility for Karnataka State Police Intelligence System
const translationCache = new Map();

// Helper to get from local storage cache
function getCachedTranslation(text, targetLang) {
  const key = `${targetLang}:${text}`;
  if (translationCache.has(key)) return translationCache.get(key);
  try {
    const stored = localStorage.getItem(`zia_trans_${key}`);
    if (stored) {
      translationCache.set(key, stored);
      return stored;
    }
  } catch (e) {}
  return null;
}

// Helper to set local storage cache
function setCachedTranslation(text, targetLang, translated) {
  const key = `${targetLang}:${text}`;
  translationCache.set(key, translated);
  try {
    localStorage.setItem(`zia_trans_${key}`, translated);
  } catch (e) {}
}

/**
 * Realtime translate text via Zia Translate API (/server/police_fir_api/api/zia/translate)
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code ('kn' or 'en')
 * @returns {Promise<string>}
 */
export async function translateTextWithZia(text, targetLang = 'kn') {
  if (!text || typeof text !== 'string' || targetLang === 'en') {
    return text;
  }

  const cached = getCachedTranslation(text, targetLang);
  if (cached) return cached;

  try {
    const res = await fetch('/server/police_fir_api/api/zia/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        target_language: targetLang,
        source_language: 'en'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.translated_text) {
        setCachedTranslation(text, targetLang, data.translated_text);
        return data.translated_text;
      }
    }
  } catch (err) {
    console.warn('Realtime Zia translation call warning:', err);
  }

  // Fallback to original text if network or server fails
  return text;
}

/**
 * React Component for Realtime Zia Translation
 */
export function ZiaText({ text, lang = 'en', className = '', style = {} }) {
  const [translated, setTranslated] = useState(text || '');

  useEffect(() => {
    let isMounted = true;
    if ((lang === 'kn' || lang === 'hi') && text) {
      translateTextWithZia(text, lang).then(res => {
        if (isMounted) {
          setTranslated(res);
        }
      });
    } else {
      setTranslated(text || '');
    }
    return () => { isMounted = false; };
  }, [text, lang]);

  return (
    <span className={className} style={{ ...style, fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      {translated}
    </span>
  );
}
