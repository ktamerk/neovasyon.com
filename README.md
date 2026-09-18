# neovasyon.com — Neova Ideathon 2026

Neova Ideathon 2026 etkinlik ve başvuru sitesi.
Build adımı yok: statik HTML + CSS + vanilla JS.

> **Önemli:** Bu depo boş olarak (sıfır commit) geldi ve `neovasyon.com`
> bu ortamın network politikası nedeniyle okunamadı. Bu yüzden mevcut kod
> üzerinde iyileştirme değil, **sıfırdan kurulum** yapıldı.
> Ayrıntılı analiz: [`docs/ANALIZ.md`](docs/ANALIZ.md).

---

## Hızlı başlangıç

```bash
python3 -m http.server 8765     # veya: npx serve -l 8765 .
# http://127.0.0.1:8765
```

Test:

```bash
npm i -D playwright && npx playwright install chromium
node tests/e2e.js               # 52 kontrol
```

---

## Dosya yapısı

```
index.html            Ana sayfa (hero → nedir → kimler → temalar → süreç →
                      kriterler → neden → geçmiş → ödül → SSS → CTA)
basvuru.html          4 adımlı başvuru formu
tesekkurler.html      Başvuru sonrası sayfa (noindex)
kvkk.html             KVKK + şartname  ← metin hukuk ekibinden gelecek
404.html

assets/js/config.js   ⭐ TÜM DEĞİŞKEN İÇERİK BURADA
assets/js/site.js     Geri sayım, SSS, analytics, sticky CTA, mobil menü
assets/js/form.js     Adım yönetimi, validation, taslak saklama, gönderim
assets/css/style.css  Tek stylesheet, design token tabanlı

docs/ANALIZ.md        Mevcut durum analizi + uygulama planı
CONTENT-TODO.md       ⭐ Bizden istenen içerik listesi
tests/e2e.js          Uçtan uca test
```

---

## İçerik nasıl güncellenir?

Tarih, ödül, son başvuru gibi bilgiler **`assets/js/config.js`** içinde tek
noktada tutulur:

```js
application: {
  deadline: '2026-10-18T23:59:00+03:00',
  deadlineLabel: '18 Ekim 2026, 23:59',
  endpoint: 'https://.../basvuru'
}
```

**Kural:** Bilgi teyitli değilse `null` bırakın.
`null` olan her alan sayfada `TODO: İçerik gerekli` rozetiyle görünür —
böylece eksik içerik yanlışlıkla yayına çıkmaz. Asla tahmini tarih/rakam
yazmayın.

`deadline` dolduğunda hero'daki geri sayım otomatik çalışmaya başlar.

---

## ⚠️ Başvuru formu ve backend

Form **şu an hiçbir backend'e bağlı değil.**
`config.js › application.endpoint` `null` olduğu sürece:

- form **gönderim yapmaz**,
- kullanıcıya "gönderim henüz aktif değil" uyarısı gösterilir,
- girilen veriler tarayıcıda saklanır (kaybolmaz).

Bu bilinçli bir tercihtir — sessizce veri kaybetmektense açıkça uyarmak.

**Yayına almadan önce mevcut başvuru kayıt sisteminin endpoint'i
girilmelidir.** Backend farklı alan adları bekliyorsa markup'a dokunmadan
`application.fieldMap` ile eşlenebilir:

```js
fieldMap: { adSoyad: 'full_name', eposta: 'email' }
```

### Neden tek `<form>`?

Form 4 adıma bölündü ama **tek bir `<form>` elementi** kullanılıyor; adımlar
sadece görsel olarak gizlenip gösteriliyor. Gönderilen payload, tek sayfalık
bir formla birebir aynı. Böylece adımlara bölme işlemi saf bir frontend
değişikliği kalıyor ve mevcut backend şeması bozulmuyor.

---

## Analytics

Sağlayıcıya sert bağımlılık yok: `window.dataLayer`'a push edilir, `gtag`
varsa ona da iletilir. GTM/GA4 snippet'i eklendiğinde event'ler otomatik akar.

Ölçülen event'ler:

| Event | Ne zaman |
|---|---|
| `apply_button_click` | Her "Hemen Başvur" (header / hero / kimler / footer / sticky / mobil menü — `location` parametresiyle) |
| `application_started` | Formda ilk gerçek etkileşim |
| `application_step_2` / `_3` / `_4` | İlgili adıma geçişte (her adım bir kez) |
| `application_completed` | Başarılı gönderimde |
| `faq_opened` | SSS maddesi açıldığında (`question` parametresiyle) |
| `theme_clicked` | Tema kartına tıklandığında |
| `past_event_viewed` | Geçmiş etkinlikler bölümü görüntülendiğinde |
| `application_validation_error` | Gönderim doğrulamada takıldığında (`step`) |
| `application_submit_blocked` | Endpoint tanımlı değilken |
| `application_submit_error` | Ağ/sunucu hatasında |

Funnel: `apply_button_click → application_started → step_2 → step_3 → step_4 → application_completed`

---

## Ölçülen sonuçlar

Lighthouse (mobil emülasyon, 375×812):

| | Ana sayfa | Başvuru |
|---|---|---|
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

`node tests/e2e.js` → 52/52 geçiyor.

Performans, framework ve web font kullanılmamasından geliyor:
harici istek yok, render-blocking kaynak yok, layout shift yok.
Gerçek etkinlik fotoğrafları eklenirken WebP/AVIF, `loading="lazy"` ve
açık `width`/`height` kullanılmalıdır (placeholder'lar bu ölçülerle işaretli).

---

## SEO

- Tek `<h1>`: *Neova Ideathon 2026*
- `<title>`: `Neova Ideathon 2026 | Neovasyon`
- Meta description'da "Neova Ideathon 2026", "6–7 Kasım 2026", "başvuru"
- OpenGraph + Twitter Card, canonical, `robots.txt`, `sitemap.xml`
- `Event` ve `FAQPage` JSON-LD

> `Event` şemasındaki `offers` bloğu (başvuru linki + son başvuru tarihi)
> bilinçli olarak yorumda bırakıldı — Google'a teyitsiz tarih vermemek için.
> `application.deadline` doldurulunca `index.html` sonundaki yorum açılmalıdır.

---

## Tarayıcı desteği

Chrome/Edge/Firefox/Safari güncel sürümler. Kullanılan modern özellikler:
`:has()`, `IntersectionObserver`, CSS grid `minmax()`, `clamp()`,
`aspect-ratio`. `:has()` desteklenmezse sadece seçili radyo kartının vurgusu
kaybolur; form işlevsel kalır.
