/* =============================================================================
 * NEOVASYON.COM – Merkezi yapılandırma
 * -----------------------------------------------------------------------------
 * Sitedeki DEĞİŞKEN tüm bilgiler burada. İçerik ekibi sadece bu dosyayı
 * düzenleyerek tarih, ödül, kontenjan vb. güncelleyebilir.
 *
 * !! KURAL: Bilgi teyitli değilse `null` bırakın.
 *    `null` olan her alan sayfada "TODO: İçerik gerekli" rozetiyle görünür.
 *    Asla tahmini tarih/rakam yazmayın.
 * ========================================================================== */
window.NEOVASYON_CONFIG = {

  /* --- Etkinlik künyesi (brief ile teyitli) ------------------------------ */
  event: {
    name: 'Neova Ideathon 2026',
    startDate: '2026-11-06',            // 6 Kasım 2026
    endDate:   '2026-11-07',            // 7 Kasım 2026
    datesLabel: '6–7 Kasım 2026',
    venueName: 'Turgut Özal Etkinlik Merkezi',
    venueArea: 'Teknopark İstanbul',
    venueAddress: 'Teknopark İstanbul, Pendik / İstanbul',
    // TODO: Google Maps kısa linki (teyit edilmeli)
    venueMapUrl: null
  },

  /* --- Başvuru ----------------------------------------------------------- */
  application: {
    // TODO: Son başvuru tarihi. Format: 'YYYY-MM-DDTHH:mm:ss+03:00'
    // Doldurulduğunda hero'daki geri sayım otomatik çalışır.
    deadline: null,
    deadlineLabel: null,                 // ör. '18 Ekim 2026, 23:59'

    // TODO: Finalistlerin açıklanma tarihi
    finalistsAnnounceLabel: null,

    /* !!! BACKEND BAĞLANTISI !!!
     * Mevcut başvuru kayıt sisteminin endpoint'i buraya girilmelidir.
     * `null` olduğu sürece form GÖNDERİM YAPMAZ, kullanıcıya uyarı gösterir.
     * Veri kaybı olmaması için bu alan deploy öncesi mutlaka doldurulmalıdır. */
    endpoint: null,
    method: 'POST',

    /* Endpoint'in beklediği alan adları buradan eşlenir.
     * Soldaki = formdaki `name`, sağdaki = backend'in beklediği anahtar.
     * Boş bırakılırsa formdaki adlar aynen gönderilir. */
    fieldMap: {},

    // Gönderim başarısız olursa gösterilecek yedek iletişim kanalı
    // TODO: Gerçek başvuru/destek e-postası ile değiştirin
    fallbackEmail: null
  },

  /* --- Ödüller ----------------------------------------------------------- */
  /* TODO: 2026 ödül tutarları teyit edilip girilmelidir.
   * NOT: 2023 ve 2024 basın bültenlerinde ödüller 50.000 / 30.000 / 20.000 TL
   * olarak geçmiştir; 2026 için TEYİTLİ DEĞİLDİR, bu yüzden yazılmadı. */
  prizes: {
    poolLabel: null,                     // ör. '100.000 TL toplam ödül'
    items: [
      { rank: 1, title: 'Birinci Takım', amount: null },
      { rank: 2, title: 'İkinci Takım',  amount: null },
      { rank: 3, title: 'Üçüncü Takım',  amount: null }
    ],
    // Basın bültenlerinde geçen, ödül dışı kazanım (teyit için işaretli)
    extras: [
      'Neova MT ve Kampüs programlarında değerlendirilme fırsatı',
      'Mentorlarla birebir çalışma ve sektör geri bildirimi'
    ]
  },

  /* --- Analytics --------------------------------------------------------- */
  analytics: {
    enabled: true,
    debug: false                         // true → event'ler console'a da basılır
  }
};
