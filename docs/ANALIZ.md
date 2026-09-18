# Neovasyon.com – Neova Ideathon 2026 · Analiz ve Uygulama Planı

> Bu doküman, brief'in "ÇALIŞMA ŞEKLİ" bölümünde istenen 10 maddelik çıktıdır.

---

## 0. ÖNEMLİ ÖN BULGU – Mevcut kod tabanı bulunamadı

Brief'in 17. maddesi ("KRİTİK KURAL") mevcut form backend'i, API'ler, başvuru kayıt
sistemi, KVKK izinleri ve analytics entegrasyonlarının **önce analiz edilmesini**
istiyor. Bu analiz yapılmaya çalışıldı ancak:

| Kontrol | Sonuç |
|---|---|
| `github.com/ktamerk/neovasyon.com` deposu | **Boş.** Hiç commit, hiç branch yok (`git ls-remote --heads` boş döndü, GitHub API `list_branches` → `[]`). |
| Çalışma dizini `/home/user/neovasyon.com` | Sadece `.git` klasörü var, hiç dosya yok. |
| Canlı site `https://neovasyon.com` | Bu ortamın network egress proxy'si tarafından **bloke**. İçerik çekilemedi. |
| Basın kaynakları (sigortamedya, sigortadunyasi, youthall) | Aynı şekilde **bloke**. Sadece arama motoru özetleri alınabildi. |

**Sonuç:** Analiz edilecek mevcut kod, mevcut form backend'i veya mevcut entegrasyon
**bu depoda yok**. Dolayısıyla "çalışan fonksiyonları yeniden yazma" kuralı
uygulanamıyor — yazılacak bir şey zaten yok.

**Bunun pratik etkisi (kritik):**

- Bu repoda teslim edilen başvuru formu, **hiçbir backend'e bağlı değildir.**
  `assets/js/config.js` içindeki `applicationEndpoint` alanı `null` bırakılmıştır.
- Canlı sitede halihazırda çalışan bir başvuru kayıt sistemi varsa, bu kod onu
  **ezmemelidir**. Deploy'dan önce mevcut endpoint bu tek alana girilmelidir.
- KVKK aydınlatma metni ve açık rıza metinleri **hukuk ekibinden alınmalıdır**;
  bu repoda `TODO` olarak işaretlenmiştir. Metin uydurulmamıştır.

Canlı sitenin export'u veya mevcut repo bana verilirse, bu planı "sıfırdan inşa"
yerine "mevcut üzerinde iyileştirme" olarak revize ederim.

---

## 1. Mevcut sayfa yapısı

Depoda dosya olmadığı için **kod düzeyinde mevcut yapı tespit edilemedi.**
Aşağıdaki tablo, bu repoda **yeni kurulan** yapıdır:

| Dosya | Rol |
|---|---|
| `index.html` | Tek sayfalık landing (hero → nedir → kimler → temalar → süreç → kriterler → neden → geçmiş → ödül → SSS → CTA) |
| `basvuru.html` | 4 adımlı başvuru formu |
| `tesekkurler.html` | Başvuru sonrası teşekkür / funnel sonu |
| `assets/css/style.css` | Tek CSS dosyası, design token tabanlı |
| `assets/js/config.js` | **Tüm değişken içerik ve endpoint'ler burada** (tek kaynak) |
| `assets/js/site.js` | Geri sayım, SSS accordion, analytics, scroll davranışı |
| `assets/js/form.js` | Çok adımlı form state, validation, taslak saklama, gönderim |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | SEO / PWA temel |

---

## 2. Eksik gördüğüm alanlar

Brief'teki 10 sorunun cevabı bir adayın ilk ekranda bulabileceği yerde olmalı.
Elimizdeki doğrulanmış veriye göre eksikler:

| Bilgi | Durum |
|---|---|
| Etkinlik tarihi (6–7 Kasım 2026) | ✅ Brief'ten geldi |
| Mekân (Turgut Özal Etkinlik Merkezi – Teknopark İstanbul) | ✅ Brief'ten geldi |
| **Son başvuru tarihi** | ❌ **TODO – İçerik gerekli** |
| **2026 ödül tutarları** | ❌ **TODO** (geçmiş yıllar basında 50/30/20 bin TL; 2026 teyitsiz) |
| **Yaş / mezuniyet kriteri detayı** | ❌ **TODO** (basında sadece "üniversite öğrencisi veya yeni mezun") |
| **Takım maksimum kişi sayısı** | ❌ **TODO** |
| **Farklı üniversite/bölüm karması takım** | ❌ **TODO** |
| **Önceki katılımcılar tekrar başvurabilir mi** | ❌ **TODO** |
| **2026 resmi temaları** | ❌ **TODO** (brief'teki örnek kategoriler "örnek" olarak kullanıldı) |
| **Değerlendirme puan ağırlıkları** | ❌ **TODO** (yüzde uydurulmadı) |
| **Ulaşım / konaklama / yemek** | ❌ **TODO** |
| **Finalist açıklanma tarihi** | ❌ **TODO** |
| **Geçmiş etkinlik rakamları** (başvuru/katılımcı/finalist sayısı) | ❌ **TODO** |
| **Etkinlik fotoğrafları** | ❌ **TODO – görsel dosyası gerekli** |
| **KVKK aydınlatma + açık rıza metinleri** | ❌ **TODO – hukuk onaylı metin gerekli** |

Tüm bu alanlar sayfada görsel olarak `TODO: İçerik gerekli` rozetiyle işaretlidir
ve `assets/js/config.js` içinde tek noktadan doldurulur.

---

## 3. Değiştirilecek component'ler

Mevcut kod olmadığı için "değiştirilecek" component yok. Canlı sitede karşılığı
olması beklenen ve **yerine geçecek** bloklar:

- Hero alanı → `#hero` (tarih, mekân, son başvuru, ödül, çift CTA, geri sayım)
- Uzun kurumsal "Ideathon nedir" metni → `#nedir` (max 4 cümle + 5 adımlı akış şeridi)
- Tek sayfa uzun başvuru formu → `basvuru.html` (4 adım + progress)
- Footer / iletişim → `#footer`

---

## 4. Yeni eklenecek component'ler

- `#kimler` – katılım kriterleri kart grid'i
- `#temalar` – problem alanı kartları + "sınırlı değildir" notu
- `#surec` – 7 adımlı timeline (mobilde dikey, masaüstünde yatay)
- `#kriterler` – değerlendirme kriterleri listesi
- `#neden` – katılımcı merkezli fayda kartları
- `#gecmis` – 2023/2024/2025 sosyal kanıt + kazanan projeler
- `#odul` – detaylı ödül bölümü
- `#sss` – `<details>` tabanlı accordion FAQ
- Sticky mobil başvuru CTA barı
- Geri sayım sayacı (son başvuru tarihine)
- `Event` JSON-LD structured data

---

## 5. Backend etkisi olan değişiklikler

**Bu teslimatta backend kodu yazılmadı.** Backend'e dokunan tek nokta:

| Konu | Durum |
|---|---|
| Form gönderim endpoint'i | `config.js › applicationEndpoint`. `null` iken form **gönderim yapmaz**, kullanıcıya net uyarı gösterir. Mevcut endpoint buraya girilmelidir. |
| Alan adları (`name` attribute'ları) | Mevcut backend şemasına göre **eşlenmelidir**. `config.js › fieldMap` ile yeniden adlandırılabilir; markup'a dokunmaya gerek yok. |
| KVKK onay kayıtları | Form, onay kutularını payload'a dahil eder (`kvkkOnay`, `acikRiza`, `iletisimIzni`). Backend'in bu alanları saklaması gerekir. |
| Analytics | `dataLayer` push + `gtag` varsa forward. GA4/GTM tarafında event'lerin tanımlanması gerekir. |

---

## 6. Sadece frontend olan değişiklikler

Aşağıdakiler tamamen frontend/content'tir, backend'e dokunmaz:

Hero, "nedir", kimler, temalar, süreç, kriterler, neden, geçmiş, ödül, SSS,
tüm tipografi/renk/layout, mobil düzen, formun **adımlara bölünmesi**,
validation mesajları, taslak saklama (localStorage), progress göstergesi,
SEO meta/OG/canonical/JSON-LD, sitemap/robots.

Formun adımlara bölünmesi, gönderilen payload'ı değiştirmez — tek bir
`<form>` elementi kullanılır, adımlar sadece görsel olarak gizlenir/gösterilir.
Bu bilinçli bir tercihtir: mevcut backend bozulmasın diye.

---

## 7. İçeriği bizden alınması gereken alanlar

`CONTENT-TODO.md` dosyasında madde madde listelendi. Özet: son başvuru tarihi,
2026 ödülleri, katılım kriterlerinin tam metni, resmi temalar, süreç tarihleri,
değerlendirme ağırlıkları, geçmiş etkinlik rakamları, etkinlik fotoğrafları,
KVKK metinleri, iletişim e-postası, sosyal medya hesapları.

---

## 8. Mobil sorunlar

Mevcut site incelenemediği için tespit edilen değil, **önlenen** sorunlar:

- Hero yüksekliği `min-height` yerine içerik bazlı + `svh` birimi (mobil adres
  çubuğu zıplaması yok)
- Ana CTA ilk ekranda; ayrıca 480px altında sticky alt bar
- Form alanları `width:100%`, `box-sizing:border-box`, `font-size:16px`
  (iOS otomatik zoom engellenir)
- `inputmode` / `autocomplete` / `type` doğru set edildi (klavye davranışı)
- Timeline mobilde dikey, masaüstünde yatay
- Kartlar `minmax()` grid ile 375px'te tek kolona düşer
- `clamp()` ile akışkan tipografi
- Tüm görsellere `width`/`height` verildi (CLS)
- 375px'te yatay scroll yok (`overflow-x:hidden` + `min-width:0` grid child'ları)

---

## 9. SEO sorunları

Uygulananlar:

- `<title>`: `Neova Ideathon 2026 | Neovasyon`
- Meta description: "Neova Ideathon 2026", "6–7 Kasım 2026", "başvuru" doğal geçiyor
- **Tek H1**: `Neova Ideathon 2026`
- OpenGraph + Twitter Card güncellendi (`og:image` **TODO – 1200×630 görsel gerekli**)
- `<link rel="canonical">` her sayfada
- `Event` JSON-LD (tarih, mekân, organizatör, offers) + `FAQPage` JSON-LD
- `lang="tr"`, semantic landmark'lar, `robots.txt`, `sitemap.xml`

---

## 10. Uygulama sırası

| Öncelik | Kapsam | Durum |
|---|---|---|
| **P0** | Hero + tarih + mekân + son başvuru + ödül + CTA | ✅ Bu teslimatta |
| **P1** | Kimler + temalar + süreç + değerlendirme | ✅ Bu teslimatta |
| **P2** | 4 adımlı başvuru formu UX | ✅ Bu teslimatta |
| **P3** | Geçmiş etkinlikler + sosyal kanıt + SSS | ✅ Bu teslimatta (rakamlar TODO) |
| **P4** | SEO + Analytics + performans | ✅ Bu teslimatta (görseller TODO) |
| **P5** | Gerçek içerik + fotoğraf + backend endpoint bağlama | ⬜ Müşteri girdisi bekliyor |

---

## Teknoloji tercihi ve gerekçesi

Depo boş olduğu için stack seçimi serbestti. **Build-step'siz statik HTML/CSS/JS**
seçildi:

- Lighthouse hedeflerini (Perf/A11y/SEO 90+) en kolay tutturan seçenek; 0 framework JS.
- Herhangi bir hosting'e (mevcut hosting dahil) olduğu gibi kopyalanabilir —
  mevcut deploy akışını bozma riski en düşük seçenek.
- İçerik ekibi `config.js` ve HTML üzerinden doğrudan düzenleyebilir.

Mevcut sitede Next.js/WordPress gibi bir stack varsa, bu HTML/CSS birebir
referans olarak o stack'e taşınabilir; markup ve token yapısı buna uygun bırakıldı.
