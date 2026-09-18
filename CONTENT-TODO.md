# İçerik Talep Listesi — Neova Ideathon 2026

Sitede **hiçbir tarih, rakam veya kural uydurulmamıştır.** Teyit edilmemiş her
alan sayfada `TODO: İçerik gerekli` rozetiyle görünür.

Aşağıdaki listeyi doldurup geri gönderin; çoğu tek dosyadan
(`assets/js/config.js`) güncellenir.

---

## 🔴 P0 — Site yayına alınmadan önce ZORUNLU

| # | Bilgi | Nereye girilecek |
|---|---|---|
| 1 | **Son başvuru tarihi** (tarih + saat) | `config.js › application.deadline` ve `deadlineLabel` |
| 2 | **Başvuru form endpoint'i** (mevcut kayıt sisteminin URL'i) | `config.js › application.endpoint` |
| 3 | **KVKK aydınlatma metni** (hukuk onaylı) | `kvkk.html` |
| 4 | **Açık rıza metni** (hukuk onaylı) | `basvuru.html` › izinler bloğu |
| 5 | **Yarışma şartnamesi** | `kvkk.html#sartname` |
| 6 | **İletişim e-postası** | `index.html` footer + `config.js › application.fallbackEmail` |

> ⚠️ 2. madde doldurulmadan form **gönderim yapmaz**. Bu bilinçli bir
> güvenliktir: sessizce veri kaybetmektense kullanıcıya açıkça
> "gönderim aktif değil" der ve bilgileri tarayıcıda saklar.

---

## 🟠 P1 — Lansmanla birlikte

| # | Bilgi | Nereye |
|---|---|---|
| 7 | **2026 ödül tutarları** (1./2./3.) | `config.js › prizes.items[].amount` |
| 8 | **Toplam ödül havuzu** (hero rozeti için) | `config.js › prizes.poolLabel` |
| 9 | **Yaş / mezuniyet kriteri** — "yeni mezun" kaç yıl? | `index.html #kimler` |
| 10 | **Takım maksimum kişi sayısı** | `index.html #kimler`, `#sss`, `basvuru.html` |
| 11 | **Farklı üniversite/bölümden takım kurulabilir mi?** | `index.html #kimler`, `#sss` |
| 12 | **Önceki katılımcılar tekrar başvurabilir mi?** | `index.html #kimler`, `#sss` |
| 13 | **Bireysel başvuranlar etkinlikte takıma yönlendiriliyor mu?** | `index.html #kimler` |
| 14 | **2026 resmî temaları** (varsa) | `index.html #temalar` + `basvuru.html` tema select |
| 15 | **Finalistlerin açıklanma tarihi** | `config.js › application.finalistsAnnounceLabel` |
| 16 | **Ön değerlendirme / eğitim tarihleri** | `index.html #surec` |
| 17 | **Katılım ücretli mi?** | `index.html #nedir`, `#sss` |
| 18 | **OG görseli** 1200×630 px | `assets/img/og-ideathon-2026.jpg` |

---

## 🟡 P2 — SSS cevapları

Aşağıdaki soruların cevabı **bilinmiyor**, bu yüzden boş bırakıldı
(`index.html #sss`):

- [ ] Katılım ücretsiz mi?
- [ ] Takım kaç kişiden oluşabilir?
- [ ] Farklı üniversite veya bölümlerden takım kurabilir miyim?
- [ ] Şehir dışından katılabilir miyim?
- [ ] Ulaşım karşılanıyor mu?
- [ ] Konaklama karşılanıyor mu?
- [ ] Yemek sağlanıyor mu?
- [ ] Daha önce geliştirdiğim bir fikirle başvurabilir miyim?
- [ ] Fikrimin prototipi olmak zorunda mı?
- [ ] Daha önce katıldım, tekrar başvurabilir miyim?

> Cevaplar girildikçe `index.html` sonundaki **FAQPage JSON-LD** bloğuna da
> eklenmelidir — şu anda sadece cevabı bilinen sorular şemada.

---

## 🟢 P3 — Sosyal kanıt (geçmiş etkinlikler)

| # | Bilgi | Not |
|---|---|---|
| 19 | 2024 ve 2025 **toplam başvuru sayısı** | Rakam uydurulmadı |
| 20 | 2024 ve 2025 **katılımcı sayısı** | |
| 21 | 2024 ve 2025 **finalist takım sayısı** | |
| 22 | **Mentor sayısı** | |
| 23 | **2024 kazanan takımlar + proje isimleri** | Bulunamadı |
| 24 | **Etkinlik fotoğrafları** (min. 4 adet, WebP/AVIF, 1200×900) | Şu an placeholder |
| 25 | **Katılımcı yorumları** (2–3 adet, isim + üniversite + foto) | |

### Teyit edilmesi gereken mevcut içerik

Aşağıdakiler **basın bültenlerinden** alındı, kurum içi kayıtlarla
doğrulanmalıdır:

- **2025:** 31 Ekim – 1 Kasım 2025, Teknopark İstanbul Turgut Özal Konferans Salonu.
  Dereceye girenler: 1. *DASK + Parametrik Sigorta*, 2. *EduTravel*,
  3. *Parametrik Sigorta Platformu*.
- **2024:** ödüller 50.000 / 30.000 / 20.000 TL.
- Kazananların **Neova MT ve Kampüs programlarında** değerlendirilme fırsatı.

> Yanlışsa `index.html #gecmis` ve `#odul` bölümlerinden düzeltilmelidir.

---

## 🎨 Marka

| # | Bilgi | Nereye |
|---|---|---|
| 26 | **Neova kurumsal renk kodları (kesin hex)** | `assets/css/style.css › :root › --brand-*` |
| 27 | **Neova / Neovasyon logo dosyası** (SVG) | `assets/img/`, `index.html` header |
| 28 | **Kurumsal font** (varsa lisanslı dosyalar) | `style.css › --font` |
| 29 | **Sosyal medya hesapları** | `index.html` footer |

Şu an kullanılan yeşil paleti Neova'nın yeşil kimliğine göre seçildi ancak
**marka kılavuzundan birebir alınmadı.** Sadece `:root` bloğundaki
`--brand-*` değerleri değiştirilerek tüm site renklenir.

---

## ⚙️ Teknik

| # | Konu | Not |
|---|---|---|
| 30 | **GA4 / GTM ölçüm kimliği** | Sayfaya gtag/GTM snippet'i eklenmeli; event'ler hazır |
| 31 | **Backend alan adları** | Formdaki `name`'ler mevcut şemayla eşleşmiyorsa `config.js › application.fieldMap` ile eşlenir |
| 32 | **Canlı sitedeki mevcut kod** | Depo boş geldi; mevcut kod paylaşılırsa bu sürüm ona göre revize edilir |
