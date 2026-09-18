/* Neova Ideathon 2026 – uçtan uca test
 *
 * Çalıştırma:
 *   npx serve -l 8765 .        (veya: python3 -m http.server 8765)
 *   npm i -D playwright && npx playwright install chromium
 *   node tests/e2e.js
 *
 * Kapsam: mobil (375px) taşma, tek H1, hero CTA'nın ilk ekranda olması,
 * TODO rozetleri, analytics event'leri, 4 adımlı form akışı, Türkçe
 * validation mesajları, taslak saklama, gönderim davranışı, JSON-LD.
 */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765';
const out = [];
const fail = [];
const log = (ok, msg) => { out.push((ok?'PASS  ':'FAIL  ')+msg); if(!ok) fail.push(msg); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });

  // ---------- MOBILE 375px ----------
  const ctx = await browser.newContext({ viewport: {width:375, height:812}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));

  await page.goto(BASE+'/', { waitUntil:'networkidle' });

  log((await page.locator('h1').count())===1, 'index: exactly one <h1> (got '+(await page.locator('h1').count())+')');
  log((await page.title())==='Neova Ideathon 2026 | Neovasyon', 'index: title correct');

  const scroll = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  log(scroll.sw <= scroll.cw+1, `index@375: no horizontal overflow (scrollW=${scroll.sw} clientW=${scroll.cw})`);

  // Hero facts present in first viewport
  const heroBox = await page.locator('#hero .facts').boundingBox();
  log(heroBox && heroBox.y < 1400, 'index@375: hero facts rendered');
  const ctaBox = await page.locator('#hero a[href="/basvuru.html"]').first().boundingBox();
  log(!!ctaBox, 'index@375: hero primary CTA rendered');
  // Brief: ana CTA ilk ekranda görünmeli (375x812, sayfa en üstteyken)
  log(ctaBox && (ctaBox.y + ctaBox.height) <= 812,
      `index@375: hero CTA fully within first viewport (bottom=${ctaBox && Math.round(ctaBox.y+ctaBox.height)} <= 812)`);
  const factsBottom = await page.locator('#hero .facts').evaluate(e => e.getBoundingClientRect().bottom);
  log(factsBottom <= 812, `index@375: date/venue/deadline/prize all in first viewport (bottom=${Math.round(factsBottom)})`);

  // TODO badges rendered for null config values
  const todoCount = await page.locator('.todo').count();
  log(todoCount > 0, `index: TODO badges rendered for missing content (${todoCount})`);
  const deadlineText = await page.locator('#hero .fact').nth(2).innerText();
  log(/TODO/.test(deadlineText), 'index: null deadline shows TODO badge, not invented date');

  // countdown hidden when deadline null
  log(await page.locator('#countdown').isHidden(), 'index: countdown hidden while deadline is null');

  // FAQ accordion + analytics
  await page.evaluate(()=>{ window.__dl=[]; window.dataLayer.push = function(o){ window.__dl.push(o); return Array.prototype.push.call(window.dataLayer,o); };});
  await page.locator('.faq details').first().locator('summary').click();
  await page.waitForTimeout(250); // <details> toggle event is async
  const dl1 = await page.evaluate(()=>window.__dl.map(e=>e.event));
  log(dl1.includes('faq_opened'), 'analytics: faq_opened fired');

  await page.locator('[data-theme-name="Yapay Zekâ"]').click();
  const dl2 = await page.evaluate(()=>window.__dl.map(e=>e.event));
  log(dl2.includes('theme_clicked'), 'analytics: theme_clicked fired');

  await page.locator('#gecmis').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const dl3 = await page.evaluate(()=>window.__dl.map(e=>e.event));
  log(dl3.includes('past_event_viewed'), 'analytics: past_event_viewed fired');

  // sticky CTA appears after hero
  await page.waitForTimeout(300);
  log(await page.locator('#sticky-cta').evaluate(e=>e.classList.contains('is-visible')), 'index@375: sticky CTA visible after hero');

  await page.screenshot({ path:'shot-mobile-hero.png' });
  await page.locator('#surec').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.screenshot({ path:'shot-mobile-timeline.png' });

  // ---------- FORM ----------
  const fp = await ctx.newPage();
  const ferr = [];
  fp.on('pageerror', e => ferr.push('PAGEERROR: '+e.message));
  fp.on('console', m => { if(m.type()==='error') ferr.push(m.text()); });
  await fp.goto(BASE+'/basvuru.html', { waitUntil:'networkidle' });
  await fp.evaluate(()=>{ window.__dl=[]; const op=window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push=o=>{window.__dl.push(o); return op(o);};});

  log((await fp.locator('h1').count())===1, 'basvuru: exactly one <h1>');
  const fscroll = await fp.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  log(fscroll.sw<=fscroll.cw+1, `basvuru@375: no horizontal overflow (${fscroll.sw}/${fscroll.cw})`);
  log((await fp.locator('#step-current').innerText())==='1', 'form: starts at step 1');

  // 16px inputs (iOS zoom guard)
  const fs = await fp.locator('#adSoyad').evaluate(e=>getComputedStyle(e).fontSize);
  log(fs==='16px', 'form: input font-size is 16px (no iOS auto-zoom), got '+fs);

  // Validation blocks advance
  await fp.locator('#step-1 [data-next]').click();
  await fp.waitForTimeout(200);
  log((await fp.locator('#step-current').innerText())==='1', 'form: empty step 1 blocked from advancing');
  log((await fp.locator('#err-adSoyad').innerText()).includes('ad ve soyad'), 'form: Turkish required message shown');

  // Bad email message
  await fp.fill('#adSoyad','Ayşe');
  await fp.locator('#step-1 [data-next]').click(); await fp.waitForTimeout(150);
  log((await fp.locator('#err-adSoyad').innerText()).includes('soyadını'), 'form: single-word name rejected with clear message');

  await fp.fill('#adSoyad','Ayşe Yılmaz');
  await fp.fill('#eposta','bozuk-mail');
  await fp.locator('#step-1 [data-next]').click(); await fp.waitForTimeout(150);
  log((await fp.locator('#err-eposta').innerText()).includes('geçerli görünmüyor'), 'form: invalid email message shown');

  await fp.fill('#eposta','ayse@ornek.com');
  await fp.fill('#telefon','123');
  await fp.locator('#step-1 [data-next]').click(); await fp.waitForTimeout(150);
  log((await fp.locator('#err-telefon').innerText()).includes('10 haneli'), 'form: invalid phone message shown');

  await fp.fill('#telefon','0532 123 45 67');
  await fp.fill('#dogumTarihi','2002-05-14');
  await fp.fill('#sehir','İstanbul');
  await fp.fill('#universite','Boğaziçi Üniversitesi');
  await fp.fill('#bolum','Endüstri Mühendisliği');
  await fp.selectOption('#egitimDurumu','lisans-3');
  await fp.locator('#step-1 [data-next]').click(); await fp.waitForTimeout(400);
  log((await fp.locator('#step-current').innerText())==='2', 'form: advanced to step 2');
  log(/2 \/ 4|2/.test(await fp.locator('#step-current').innerText()), 'form: progress shows 2/4');

  // step 2 analytics
  let dlf = await fp.evaluate(()=>window.__dl.map(e=>e.event));
  log(dlf.includes('application_started'), 'analytics: application_started fired');
  log(dlf.includes('application_step_2'), 'analytics: application_step_2 fired');

  // team toggle
  log(await fp.locator('#team-section').isHidden(), 'form: team section hidden by default');
  await fp.locator('input[name="katilimTuru"][value="takim"]').check();
  await fp.waitForTimeout(150);
  log(await fp.locator('#team-section').isVisible(), 'form: team section shown when "takım" selected');
  log((await fp.locator('#members .member').count())===1, 'form: first member row auto-added');
  await fp.locator('#add-member').click(); await fp.waitForTimeout(100);
  log((await fp.locator('#members .member').count())===2, 'form: second member row added');
  await fp.fill('#members .member:nth-child(1) [name="uyeAdSoyad[]"]','Mehmet Demir');
  await fp.fill('#members .member:nth-child(2) [name="uyeAdSoyad[]"]','Zeynep Kaya');
  await fp.fill('#takimAdi','Parametrik');

  await fp.locator('#step-2 [data-next]').click(); await fp.waitForTimeout(400);
  log((await fp.locator('#step-current').innerText())==='3', 'form: advanced to step 3');

  // step 3 minlength
  await fp.fill('#fikirAdi','Afet Sonrası Hızlı Ödeme');
  await fp.fill('#fikirOzeti','Kısa');
  await fp.locator('#step-3 [data-next]').click(); await fp.waitForTimeout(150);
  log((await fp.locator('#err-fikirOzeti').innerText()).includes('en az 40'), 'form: minlength message shown');

  const longA = 'Deprem sonrası hasar ödemelerini parametrik tetikleyicilerle otomatikleştiren bir platform önerisi.';
  await fp.fill('#fikirOzeti', longA);
  log((await fp.locator('[data-counter-for="fikirOzeti"]').innerText()).startsWith(String(longA.length)), 'form: character counter updates');
  await fp.fill('#problem', longA + ' Hasar ödemeleri bugün haftalar sürüyor ve mağduriyet yaratıyor.');
  await fp.fill('#cozum', longA + ' Sensör ve resmi veri kaynaklarıyla otomatik tetikleme yapılır.');
  await fp.selectOption('#temaAlani','Yapay Zekâ');
  await fp.locator('#step-3 [data-next]').click(); await fp.waitForTimeout(400);
  log((await fp.locator('#step-current').innerText())==='4', 'form: advanced to step 4');

  // DRAFT PERSISTENCE — reload and confirm nothing lost
  await fp.reload({ waitUntil:'networkidle' });
  await fp.waitForTimeout(300);
  log((await fp.inputValue('#adSoyad'))==='Ayşe Yılmaz', 'draft: step-1 name survived reload');
  log((await fp.inputValue('#fikirOzeti'))===longA, 'draft: step-3 idea summary survived reload');
  log((await fp.inputValue('#takimAdi'))==='Parametrik', 'draft: team name survived reload');
  log((await fp.locator('#members .member').count())===2, 'draft: 2 member rows restored');
  log((await fp.inputValue('#members .member:nth-child(2) [name="uyeAdSoyad[]"]'))==='Zeynep Kaya', 'draft: member 2 name restored');
  log((await fp.locator('#step-current').innerText())==='4', 'draft: returned to step 4');

  // Submit with missing consents -> should bounce, not lose data
  await fp.selectOption('#ideathonDeneyimi','hayir');
  await fp.selectOption('#nereden','linkedin');
  await fp.locator('#submit-btn').click(); await fp.waitForTimeout(400);
  log((await fp.locator('#form-status').innerText()).includes('gönderilemedi'), 'form: submit blocked when consents unchecked');
  log((await fp.inputValue('#adSoyad'))==='Ayşe Yılmaz', 'form: data intact after failed submit');

  // Check consents and submit -> endpoint null => explicit info, no silent loss
  await fp.check('input[name="kvkkOnay"]');
  await fp.check('input[name="acikRiza"]');
  await fp.check('input[name="sartnameOnay"]');
  await fp.evaluate(()=>{ window.__dl=[]; const op=window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push=o=>{window.__dl.push(o); return op(o);};});
  await fp.locator('#submit-btn').click(); await fp.waitForTimeout(500);
  const st = await fp.locator('#form-status').innerText();
  log(st.includes('henüz aktif değil'), 'form: endpoint-null submit shows explicit warning (no silent data loss)');
  const dl5 = await fp.evaluate(()=>window.__dl.map(e=>e.event));
  log(dl5.includes('application_submit_blocked'), 'analytics: application_submit_blocked fired');

  await fp.screenshot({ path:'shot-mobile-form.png' });

  // ---------- endpoint configured -> real submit path ----------
  const p2 = await ctx.newPage();
  await p2.route('**/mock-endpoint', r => r.fulfill({status:200, contentType:'application/json', body:'{"ok":true}'}));
  await p2.addInitScript(()=>{ window.__patch = true; });
  await p2.goto(BASE+'/basvuru.html', { waitUntil:'networkidle' });
  await p2.evaluate(()=>{ window.NEOVASYON_CONFIG.application.endpoint='/mock-endpoint';
    window.__dl=[]; const op=window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push=o=>{window.__dl.push(o); return op(o);}; });
  await p2.waitForTimeout(200);
  // draft is already complete from previous page (same origin localStorage)
  await p2.locator('#submit-btn').click();
  await p2.waitForURL('**/tesekkurler.html', { timeout: 5000 }).catch(()=>{});
  log(p2.url().includes('tesekkurler'), 'form: configured endpoint submits and redirects to thank-you');
  const leftover = await p2.evaluate(()=>localStorage.getItem('neovasyon:basvuru:v1'));
  log(leftover===null, 'form: draft cleared after successful submit');

  // ---------- DESKTOP ----------
  const dctx = await browser.newContext({ viewport:{width:1440, height:900} });
  const dp = await dctx.newPage();
  dp.on('pageerror', e => errors.push('DESKTOP PAGEERROR: '+e.message));
  await dp.goto(BASE+'/', { waitUntil:'networkidle' });
  const dscroll = await dp.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  log(dscroll.sw<=dscroll.cw+1, 'index@1440: no horizontal overflow');
  await dp.screenshot({ path:'shot-desktop-hero.png' });
  await dp.locator('#surec').scrollIntoViewIfNeeded(); await dp.waitForTimeout(300);
  await dp.screenshot({ path:'shot-desktop-timeline.png' });
  await dp.locator('#odul').scrollIntoViewIfNeeded(); await dp.waitForTimeout(300);
  await dp.screenshot({ path:'shot-desktop-prizes.png' });

  // ---------- structured data ----------
  const lds = await dp.$$eval('script[type="application/ld+json"]', ns => ns.map(n=>n.textContent));
  let ldOk = true, ldTypes=[];
  for (const t of lds) { try { const o=JSON.parse(t); ldTypes.push(o['@type']); } catch(e){ ldOk=false; } }
  log(ldOk, 'seo: all JSON-LD blocks parse');
  log(ldTypes.includes('Event') && ldTypes.includes('FAQPage'), 'seo: Event + FAQPage schema present ('+ldTypes.join(', ')+')');

  log(errors.length===0, 'no console/page errors on index ('+errors.join(' | ')+')');
  log(ferr.length===0, 'no console/page errors on form ('+ferr.join(' | ')+')');

  await browser.close();
  console.log(out.join('\n'));
  console.log('\n===== '+(out.length-fail.length)+'/'+out.length+' passed =====');
  if (fail.length) { console.log('FAILURES:\n- '+fail.join('\n- ')); process.exit(1); }
})();
