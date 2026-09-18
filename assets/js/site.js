/* =============================================================================
 * NEOVASYON.COM – Ortak site davranışları
 * Bağımlılık yok. `defer` ile yüklenir.
 * ========================================================================== */
(function () {
  'use strict';

  var CFG = window.NEOVASYON_CONFIG || {};

  /* ---------------------------------------------------------------------
   * 1) ANALYTICS
   * GA4 (gtag) ve/veya GTM (dataLayer) varsa oraya yazar; yoksa sessizce
   * dataLayer'a biriktirir. Hiçbir sağlayıcıya sert bağımlılık yok.
   * ------------------------------------------------------------------ */
  window.dataLayer = window.dataLayer || [];

  function track(eventName, params) {
    if (CFG.analytics && CFG.analytics.enabled === false) return;
    var payload = params || {};
    try {
      window.dataLayer.push(Object.assign({ event: eventName }, payload));
      if (typeof window.gtag === 'function') window.gtag('event', eventName, payload);
      if (CFG.analytics && CFG.analytics.debug) {
        console.log('[analytics]', eventName, payload);
      }
    } catch (e) { /* analytics asla sayfayı kırmamalı */ }
  }
  window.neoTrack = track;

  /* data-track="event_adı" olan her elemana tıklanınca event gönder */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    track(el.getAttribute('data-track'), {
      label: el.getAttribute('data-track-label') || (el.textContent || '').trim().slice(0, 60),
      location: el.getAttribute('data-track-location') || ''
    });
  });

  /* ---------------------------------------------------------------------
   * 2) CONFIG → DOM
   * data-cfg="yol.to.deger" olan elemanları config'ten doldurur.
   * Değer null ise "TODO: İçerik gerekli" rozeti basılır (uydurma yok).
   * ------------------------------------------------------------------ */
  function resolve(path) {
    return path.split('.').reduce(function (acc, key) {
      return (acc === null || acc === undefined) ? null : acc[key];
    }, CFG);
  }

  document.querySelectorAll('[data-cfg]').forEach(function (el) {
    var value = resolve(el.getAttribute('data-cfg'));
    if (value === null || value === undefined || value === '') {
      el.innerHTML = '<span class="todo">TODO: İçerik gerekli</span>';
      el.setAttribute('data-content-missing', 'true');
    } else {
      el.textContent = value;
    }
  });

  /* ---------------------------------------------------------------------
   * 3) GERİ SAYIM (son başvuru tarihine)
   * config.application.deadline null ise sayaç hiç gösterilmez.
   * ------------------------------------------------------------------ */
  (function countdown() {
    var box = document.getElementById('countdown');
    if (!box) return;

    var raw = CFG.application && CFG.application.deadline;
    if (!raw) { box.hidden = true; return; }

    var target = new Date(raw).getTime();
    if (isNaN(target)) { box.hidden = true; return; }

    var out = {
      d: box.querySelector('[data-cd="d"]'),
      h: box.querySelector('[data-cd="h"]'),
      m: box.querySelector('[data-cd="m"]')
    };
    var pad = function (n) { return String(n).padStart(2, '0'); };

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        box.innerHTML = '<p class="countdown__label">Başvurular kapanmıştır.</p>';
        clearInterval(timer);
        return;
      }
      var mins = Math.floor(diff / 60000);
      out.d.textContent = Math.floor(mins / 1440);
      out.h.textContent = pad(Math.floor(mins / 60) % 24);
      out.m.textContent = pad(mins % 60);
    }
    tick();
    var timer = setInterval(tick, 30000);
  })();

  /* ---------------------------------------------------------------------
   * 4) SSS — açılma event'i (faq_opened)
   * ------------------------------------------------------------------ */
  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      var q = d.querySelector('summary');
      track('faq_opened', { question: q ? q.textContent.trim().slice(0, 100) : '' });
    });
  });

  /* ---------------------------------------------------------------------
   * 5) Tema kartı tıklaması (theme_clicked)
   * ------------------------------------------------------------------ */
  document.querySelectorAll('[data-theme-name]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('theme_clicked', { theme: el.getAttribute('data-theme-name') });
    });
  });

  /* ---------------------------------------------------------------------
   * 6) Geçmiş etkinlik görüntülenmesi (past_event_viewed) — 1 kez
   * ------------------------------------------------------------------ */
  (function observePast() {
    var section = document.getElementById('gecmis');
    if (!section || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          track('past_event_viewed', { section: 'gecmis' });
          io.disconnect();
        }
      });
    }, {
      /* threshold DEĞİL rootMargin kullanılıyor: #gecmis bölümü mobilde
         viewport'tan uzun (≈2840px / 812px), bu yüzden 0.35 gibi bir oran
         375px'te hiçbir zaman yakalanamıyordu. */
      threshold: 0,
      rootMargin: '0px 0px -25% 0px'
    });
    io.observe(section);
  })();

  /* ---------------------------------------------------------------------
   * 7) Sticky mobil CTA — hero geçildikten sonra görünür
   * ------------------------------------------------------------------ */
  (function stickyCta() {
    var bar = document.getElementById('sticky-cta');
    var hero = document.getElementById('hero');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;

    document.body.classList.add('has-sticky-cta');
    var io = new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(hero);
  })();

  /* ---------------------------------------------------------------------
   * 8) Mobil menü: link tıklanınca kapansın, dışarı tıklayınca kapansın
   * ------------------------------------------------------------------ */
  (function mobileMenu() {
    var menu = document.querySelector('.menu');
    if (!menu) return;
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) menu.open = false;
    });
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) menu.open = false;
    });
  })();

})();
