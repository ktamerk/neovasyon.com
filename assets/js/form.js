/* =============================================================================
 * NEOVASYON.COM – Çok adımlı başvuru formu
 *
 * Tasarım kararları:
 *  - TEK <form> elementi kullanılır; adımlar sadece gizlenir/gösterilir.
 *    Gönderilen payload, tek sayfalık formla birebir aynıdır → mevcut backend
 *    şeması bozulmaz.
 *  - Adımlar arası geçişte hiçbir veri kaybolmaz (DOM'dan silinmez).
 *  - Taslak localStorage'a yazılır; sayfa kapansa bile veri kalır.
 *  - Endpoint yoksa form GÖNDERMEZ ve kullanıcıya bunu açıkça söyler.
 * ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('application-form');
  if (!form) return;

  var CFG   = window.NEOVASYON_CONFIG || {};
  var APP   = CFG.application || {};
  var track = window.neoTrack || function () {};

  var DRAFT_KEY = 'neovasyon:basvuru:v1';
  var TOTAL     = 4;
  var STEP_NAMES = ['Seni Tanıyalım', 'Takım', 'Fikir', 'Son Bilgiler'];

  var current = 1;
  var startedTracked = false;
  var stepTracked = {};

  /* ---------------------------------------------------------------------
   * Yardımcılar
   * ------------------------------------------------------------------ */
  function stepEl(n) { return document.getElementById('step-' + n); }

  function fieldsIn(n) {
    return Array.prototype.slice.call(
      stepEl(n).querySelectorAll('input, select, textarea')
    ).filter(function (el) {
      return el.type !== 'hidden' && !el.disabled && el.name !== 'website';
    });
  }

  function errorBox(el) {
    // Radyo/checkbox grupları ortak kutuya yazar
    if (el.name === 'katilimTuru') return document.getElementById('err-katilimTuru');
    if (['kvkkOnay', 'acikRiza', 'sartnameOnay'].indexOf(el.name) > -1) {
      return document.getElementById('err-consents');
    }
    return document.getElementById('err-' + el.id) ||
           el.closest('.field') && el.closest('.field').querySelector('.error-msg');
  }

  function showError(el, msg) {
    el.setAttribute('aria-invalid', 'true');
    var box = errorBox(el);
    if (box) {
      box.textContent = msg;
      box.classList.add('is-shown');
      if (!box.id) box.id = 'err-auto-' + Math.random().toString(36).slice(2, 8);
      el.setAttribute('aria-describedby', box.id);
    }
  }

  function clearError(el) {
    el.removeAttribute('aria-invalid');
    var box = errorBox(el);
    if (box) { box.textContent = ''; box.classList.remove('is-shown'); }
  }

  /* ---------------------------------------------------------------------
   * Doğrulama — mesajlar Türkçe ve tarayıcı diline bağlı değil
   * ------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  function normalizePhone(v) { return (v || '').replace(/\D/g, ''); }

  function validateField(el) {
    var val = (el.value || '').trim();
    var msg = el.getAttribute('data-error-required') || 'Bu alan zorunludur.';

    /* Radyo grubu */
    if (el.type === 'radio') {
      var anyChecked = form.querySelectorAll('input[name="' + el.name + '"]:checked').length > 0;
      if (el.required && !anyChecked) { showError(el, msg); return false; }
      clearError(el); return true;
    }

    /* Onay kutusu */
    if (el.type === 'checkbox') {
      if (el.required && !el.checked) { showError(el, msg); return false; }
      clearError(el); return true;
    }

    /* Zorunlu boş */
    if (el.required && !val) { showError(el, msg); return false; }
    if (!val) { clearError(el); return true; }

    /* Ad Soyad — en az iki kelime */
    if (el.id === 'adSoyad' && val.split(/\s+/).filter(Boolean).length < 2) {
      showError(el, el.getAttribute('data-error-pattern')); return false;
    }

    /* E-posta */
    if (el.type === 'email' && !EMAIL_RE.test(val)) {
      showError(el, el.getAttribute('data-error-pattern')); return false;
    }

    /* Telefon — 10 hane (başındaki 0 veya +90 tolere edilir) */
    if (el.type === 'tel') {
      var digits = normalizePhone(val).replace(/^90/, '').replace(/^0/, '');
      if (digits.length !== 10) {
        showError(el, el.getAttribute('data-error-pattern')); return false;
      }
    }

    /* Tarih aralığı */
    if (el.type === 'date') {
      if ((el.min && val < el.min) || (el.max && val > el.max)) {
        showError(el, el.getAttribute('data-error-range') || 'Geçerli bir tarih seç.');
        return false;
      }
    }

    /* Minimum uzunluk */
    var min = parseInt(el.getAttribute('minlength'), 10);
    if (min && val.length < min) {
      showError(el, el.getAttribute('data-error-minlength') ||
        ('Bu alan en az ' + min + ' karakter olmalı.'));
      return false;
    }

    clearError(el);
    return true;
  }

  function validateStep(n) {
    var ok = true;
    var firstBad = null;
    var seenRadio = {};

    fieldsIn(n).forEach(function (el) {
      // Gizli bölümdeki alanları atla (ör. bireysel başvuruda takım alanları)
      if (el.closest('[hidden]')) return;
      // Radyo grubunu bir kez doğrula
      if (el.type === 'radio') {
        if (seenRadio[el.name]) return;
        seenRadio[el.name] = true;
      }
      if (!validateField(el)) {
        ok = false;
        if (!firstBad) firstBad = el;
      }
    });

    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }

  /* ---------------------------------------------------------------------
   * Adım geçişleri
   * ------------------------------------------------------------------ */
  function renderProgress() {
    document.getElementById('step-current').textContent = current;
    document.getElementById('step-name').textContent = STEP_NAMES[current - 1];
    document.getElementById('progress-fill').style.width = (current / TOTAL * 100) + '%';
    document.getElementById('progressbar').setAttribute('aria-valuenow', current);
    document.getElementById('step-announce').textContent =
      'Adım ' + current + ' / ' + TOTAL + ': ' + STEP_NAMES[current - 1];

    var items = document.querySelectorAll('#progress-steps li');
    items.forEach(function (li, i) {
      li.classList.toggle('is-done', (i + 1) < current);
      if ((i + 1) === current) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  }

  function goTo(n) {
    if (n < 1 || n > TOTAL) return;
    for (var i = 1; i <= TOTAL; i++) stepEl(i).hidden = (i !== n);
    current = n;
    renderProgress();

    // Adım başlığını görünür alana getir (mobilde önemli)
    var y = document.querySelector('.progress').getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

    // Analytics funnel — her adım bir kez
    if (n > 1 && !stepTracked[n]) {
      stepTracked[n] = true;
      if (n === 2) track('application_step_2', { step: 2 });
      if (n === 3) track('application_step_3', { step: 3 });
      if (n === 4) track('application_step_4', { step: 4 });
    }
    saveDraft();
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) {
      if (validateStep(current)) goTo(current + 1);
    }
    if (e.target.closest('[data-prev]')) {
      goTo(current - 1);
    }
  });

  /* Enter'a basınca son adım hariç ileri git (textarea hariç) */
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var t = e.target;
    if (t.tagName === 'TEXTAREA' || t.type === 'submit') return;
    e.preventDefault();
    if (current < TOTAL && validateStep(current)) goTo(current + 1);
  });

  /* ---------------------------------------------------------------------
   * application_started — ilk gerçek etkileşimde
   * ------------------------------------------------------------------ */
  form.addEventListener('input', function () {
    if (!startedTracked) {
      startedTracked = true;
      track('application_started', { step: 1 });
    }
  }, { once: false });

  /* Alan blur'da anında doğrula (hata varsa) */
  form.addEventListener('blur', function (e) {
    var el = e.target;
    if (!el.name || el.name === 'website') return;
    if (el.hasAttribute('aria-invalid')) validateField(el);
  }, true);

  /* Hata gösterilmişken düzeltince hata anında kalksın */
  form.addEventListener('input', function (e) {
    if (e.target.hasAttribute('aria-invalid')) validateField(e.target);
  });
  form.addEventListener('change', function (e) {
    if (e.target.hasAttribute('aria-invalid')) validateField(e.target);
  });

  /* ---------------------------------------------------------------------
   * Karakter sayaçları
   * ------------------------------------------------------------------ */
  document.querySelectorAll('[data-counter]').forEach(function (el) {
    var max = parseInt(el.getAttribute('data-counter'), 10);
    var out = document.querySelector('[data-counter-for="' + el.id + '"]');
    if (!out) return;
    function upd() {
      out.textContent = el.value.length + ' / ' + max;
      out.classList.toggle('is-over', el.value.length > max);
    }
    el.addEventListener('input', upd);
    upd();
  });

  /* ---------------------------------------------------------------------
   * Takım bölümü
   * ------------------------------------------------------------------ */
  var teamSection = document.getElementById('team-section');
  var membersBox  = document.getElementById('members');
  var addBtn      = document.getElementById('add-member');

  function syncTeamVisibility() {
    var sel = form.querySelector('input[name="katilimTuru"]:checked');
    var isTeam = sel && sel.value === 'takim';
    teamSection.hidden = !isTeam;
    if (isTeam && membersBox.children.length === 0) addMember();
    saveDraft();
  }

  form.querySelectorAll('input[name="katilimTuru"]').forEach(function (r) {
    r.addEventListener('change', syncTeamVisibility);
  });

  function addMember(data) {
    var i = membersBox.children.length + 1;
    var wrap = document.createElement('div');
    wrap.className = 'member';
    wrap.innerHTML =
      '<div class="member__head">' +
        '<span class="member__title">Takım üyesi ' + i + '</span>' +
        '<button type="button" class="member__remove">Kaldır</button>' +
      '</div>' +
      '<div class="field">' +
        '<label>Ad Soyad</label>' +
        '<input type="text" name="uyeAdSoyad[]" autocomplete="off">' +
      '</div>' +
      '<div class="field">' +
        '<label>E-posta</label>' +
        '<input type="email" name="uyeEposta[]" inputmode="email" autocomplete="off" ' +
               'data-error-pattern="E-posta adresi geçerli görünmüyor. Örnek: ad@ornek.com">' +
        '<p class="error-msg"></p>' +
      '</div>' +
      '<div class="field">' +
        '<label>Üniversite / Bölüm</label>' +
        '<input type="text" name="uyeOkul[]" autocomplete="off">' +
      '</div>';
    membersBox.appendChild(wrap);

    if (data) {
      wrap.querySelector('[name="uyeAdSoyad[]"]').value = data.ad || '';
      wrap.querySelector('[name="uyeEposta[]"]').value  = data.eposta || '';
      wrap.querySelector('[name="uyeOkul[]"]').value    = data.okul || '';
    }
    renumberMembers();
  }

  function renumberMembers() {
    Array.prototype.forEach.call(membersBox.children, function (m, idx) {
      m.querySelector('.member__title').textContent = 'Takım üyesi ' + (idx + 1);
    });
  }

  addBtn && addBtn.addEventListener('click', function () {
    addMember();
    track('team_member_added', { count: membersBox.children.length });
    saveDraft();
  });

  membersBox && membersBox.addEventListener('click', function (e) {
    if (!e.target.closest('.member__remove')) return;
    e.target.closest('.member').remove();
    renumberMembers();
    saveDraft();
  });

  /* ---------------------------------------------------------------------
   * Taslak saklama (localStorage) — veri kaybı olmasın
   * ------------------------------------------------------------------ */
  function collect() {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (value, key) {
      if (key.slice(-2) === '[]') {
        (data[key] = data[key] || []).push(value);
      } else if (data[key] !== undefined) {
        data[key] = [].concat(data[key], value);
      } else {
        data[key] = value;
      }
    });
    // İşaretlenmemiş onay kutuları da açıkça gönderilsin
    form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      if (!cb.checked) data[cb.name] = '';
    });
    return data;
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step: current,
        memberCount: membersBox ? membersBox.children.length : 0,
        values: collect(),
        savedAt: Date.now()
      }));
    } catch (e) { /* kota dolu / private mode — sessizce geç */ }
  }

  function loadDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;

    var draft;
    try { draft = JSON.parse(raw); } catch (e) { return; }
    if (!draft || !draft.values) return;

    var v = draft.values;

    // Takım üyesi satırlarını önce oluştur
    var count = draft.memberCount || 0;
    for (var i = 0; i < count; i++) {
      addMember({
        ad:     (v['uyeAdSoyad[]'] || [])[i],
        eposta: (v['uyeEposta[]']  || [])[i],
        okul:   (v['uyeOkul[]']    || [])[i]
      });
    }

    Object.keys(v).forEach(function (key) {
      if (key.slice(-2) === '[]') return; // yukarıda dolduruldu
      var els = form.querySelectorAll('[name="' + key + '"]');
      if (!els.length) return;
      els.forEach(function (el) {
        if (el.type === 'radio')        el.checked = (el.value === v[key]);
        else if (el.type === 'checkbox') el.checked = !!v[key];
        else                             el.value = v[key];
      });
    });

    // Sayaçları ve takım görünürlüğünü tazele
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      el.dispatchEvent(new Event('input', { bubbles: false }));
    });
    syncTeamVisibility();

    if (draft.step && draft.step > 1 && draft.step <= TOTAL) {
      for (var s = 1; s <= TOTAL; s++) stepEl(s).hidden = (s !== draft.step);
      current = draft.step;
      renderProgress();
    }
  }

  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  var clearBtn = document.getElementById('clear-draft');
  clearBtn && clearBtn.addEventListener('click', function () {
    if (!window.confirm('Formdaki tüm bilgiler silinecek. Emin misin?')) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    form.reset();
    membersBox.innerHTML = '';
    syncTeamVisibility();
    goTo(1);
  });

  /* ---------------------------------------------------------------------
   * Gönderim
   * ------------------------------------------------------------------ */
  var statusBox = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');

  function setStatus(kind, html) {
    statusBox.className = 'form-status is-shown form-status--' + kind;
    statusBox.innerHTML = html;
    statusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function applyFieldMap(data) {
    var map = APP.fieldMap || {};
    if (!Object.keys(map).length) return data;
    var out = {};
    Object.keys(data).forEach(function (k) { out[map[k] || k] = data[k]; });
    return out;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Bot tuzağı doluysa sessizce yut
    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value) return;

    // Tüm adımları doğrula, ilk hatalı adıma dön
    for (var n = 1; n <= TOTAL; n++) {
      var wasHidden = stepEl(n).hidden;
      stepEl(n).hidden = false;
      var ok = validateStep(n);
      stepEl(n).hidden = wasHidden;
      if (!ok) {
        goTo(n);
        setStatus('error',
          '<strong>Başvurun gönderilemedi.</strong> ' + n + '. adımda eksik veya ' +
          'hatalı alanlar var. Kırmızı işaretli alanları kontrol eder misin?');
        track('application_validation_error', { step: n });
        return;
      }
    }

    var payload = applyFieldMap(collect());

    /* --- Endpoint yoksa: VERİ KAYBETME, kullanıcıyı bilgilendir --- */
    if (!APP.endpoint) {
      var fallback = APP.fallbackEmail
        ? ' Bu arada başvurunu <a href="mailto:' + APP.fallbackEmail + '">' +
          APP.fallbackEmail + '</a> adresine iletebilirsin.'
        : '';
      setStatus('info',
        '<strong>Başvuru gönderimi henüz aktif değil.</strong> ' +
        'Bu sitede başvuru kayıt servisi tanımlı değil, bu yüzden formun ' +
        '<em>gönderilmedi</em>. Girdiğin bilgiler tarayıcında saklandı; ' +
        'kaybolmayacak.' + fallback +
        '<br><br><small>Geliştirici notu: <code>assets/js/config.js › ' +
        'application.endpoint</code> alanına mevcut başvuru endpoint\'i ' +
        'girilmelidir.</small>');
      track('application_submit_blocked', { reason: 'endpoint_not_configured' });
      console.warn('[neovasyon] Başvuru endpoint\'i tanımlı değil. Payload:', payload);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Gönderiliyor…';
    statusBox.className = 'form-status';

    fetch(APP.endpoint, {
      method: APP.method || 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        track('application_completed', {
          katilim_turu: payload.katilimTuru || '',
          tema: payload.temaAlani || ''
        });
        try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
        window.location.href = '/tesekkurler.html';
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Başvurumu gönder';
        var fb = APP.fallbackEmail
          ? ' Sorun devam ederse <a href="mailto:' + APP.fallbackEmail + '">' +
            APP.fallbackEmail + '</a> adresinden bize yazabilirsin.'
          : '';
        setStatus('error',
          '<strong>Başvurun gönderilemedi.</strong> Bağlantıda bir sorun oluştu. ' +
          'Bilgilerin kaybolmadı — birkaç saniye sonra tekrar dener misin?' + fb);
        track('application_submit_error', { message: String(err && err.message) });
      });
  });

  /* ---------------------------------------------------------------------
   * Başlat
   * ------------------------------------------------------------------ */
  loadDraft();
  syncTeamVisibility();
  renderProgress();
})();
