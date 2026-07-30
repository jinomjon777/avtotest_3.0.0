export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  publishedDate: string; // ISO
  keywords: string;
  sections: BlogSection[];
  relatedLinks: { label: string; path: string }[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "avto-test-2026-savollari",
    title: "Avto Test 2026 Savollari — Nimalarga E'tibor Berish Kerak?",
    seoTitle: "Avto Test 2026 Savollari — To'liq Qo'llanma",
    seoDescription:
      "Avto test 2026 savollari qanday tuzilgan, qaysi mavzular ko'proq uchraydi va ularga qanday tayyorlanish kerak — to'liq va amaliy qo'llanma.",
    excerpt:
      "2026 yilgi avto test savollari qanday tuzilgan va ularga qanday tayyorlanish kerakligi haqida amaliy maslahatlar.",
    publishedDate: "2026-07-20",
    keywords: "avto test 2026 savollari, avtotest 2026, YHQ savollari",
    sections: [
      {
        heading: "2026 yilgi savollar bazasi nimasi bilan farq qiladi?",
        paragraphs: [
          "Har yili yo'l harakati qoidalariga kichik-katta o'zgartirishlar kiritiladi — yangi belgilar, jarima miqdorlarining yangilanishi, ayrim qoidalarning aniqlashtirilishi. Shu sababli 2026 yilgi savollar bazasi bilan mashq qilish, eskirgan yoki hozirda amal qilmaydigan qoidalar asosida tayyorgarlik ko'rish xavfini kamaytiradi.",
          "Savollar bazasi mavzular bo'yicha tuzilgan bo'lib, har bir mavzu haqiqiy imtihonda uchraydigan savollarning taxminiy taqsimotiga mos keladi. Bu esa qaysi mavzularga ko'proq vaqt ajratish kerakligini aniqlashga yordam beradi.",
        ],
      },
      {
        heading: "Qaysi mavzular ko'proq uchraydi?",
        paragraphs: [
          "Tajriba shuni ko'rsatadiki, imtihonlarda eng ko'p uchraydigan mavzular qatoriga yo'l belgilari va ularning ma'nolari, chorrahalardan o'tish tartibi, imtiyozli transport vositalariga yo'l berish qoidalari, hamda to'xtash va turish taqiqlari kiradi. Bu mavzularni alohida-alohida, mavzuli test rejimida mashq qilish samarali natija beradi.",
          "Shuningdek, jarima va javobgarlik bilan bog'liq savollar ham imtihonda muntazam uchraydi — bu qismni ko'pchilik e'tiborsiz qoldiradi, biroq aynan shu mavzu bo'yicha xatolar keng tarqalgan.",
        ],
      },
      {
        heading: "Qanday tayyorgarlik ko'rish tavsiya etiladi?",
        paragraphs: [
          "Avval mavzular bo'yicha mashq qiling — har bir mavzuni alohida o'rganib, tushunmagan joylaringizni aniqlang. So'ngra rasmiy variant tartibidagi testlarga o'ting, bu sizga haqiqiy imtihon tuzilishiga ko'nikish imkonini beradi. Oxirgi bosqichda esa vaqt chegarasi bilan (20 savol / 25 daqiqa) to'liq imitatsiya testlarini ishlang — bu sizni imtihon kunidagi vaqt bosimiga psixologik jihatdan tayyorlaydi.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Avto Test 2026", path: "/avto-test-2026" },
      { label: "Mavzuli testlar", path: "/mavzuli" },
      { label: "Rasmiy variantlar", path: "/variant" },
    ],
  },
  {
    slug: "prava-imtihoniga-tayyorgarlik",
    title: "Prava Imtihoniga Qanday Tayyorlanish Kerak?",
    seoTitle: "Prava Imtihoniga Tayyorgarlik — Amaliy Qo'llanma",
    seoDescription:
      "Haydovchilik guvohnomasi (prava) imtihoniga samarali tayyorgarlik ko'rish uchun bosqichma-bosqich reja va amaliy maslahatlar.",
    excerpt:
      "Prava imtihoniga tayyorgarlik ko'rishning eng samarali yo'li — to'g'ri rejalashtirish va izchil mashq qilish.",
    publishedDate: "2026-07-18",
    keywords: "prava imtihoniga tayyorgarlik, haydovchilik guvohnomasi, avtomaktab",
    sections: [
      {
        heading: "Nazariy tayyorgarlikdan boshlang",
        paragraphs: [
          "Prava imtihoni ikki qismdan iborat — nazariy (YHQ testi) va amaliy (mashina boshqarish). Ko'pchilik amaliy qismga ko'proq e'tibor qaratib, nazariy qismni yengil deb hisoblaydi — bu esa ko'p hollarda aynan shu qismda kutilmagan qiyinchiliklarga olib keladi. Nazariy tayyorgarlikni kamida imtihondan 2-3 hafta oldin boshlash tavsiya etiladi.",
        ],
      },
      {
        heading: "Muntazam, kichik bo'laklarda mashq qiling",
        paragraphs: [
          "Bir kunda yuzlab savolni bir yo'la yechishdan ko'ra, har kuni 20-30 daqiqa davomida izchil mashq qilish ancha samarali. Bu miya uchun ma'lumotni uzoq muddatli xotiraga o'tkazish jarayonini yaxshilaydi va charchoqdan kelib chiqadigan xatolarni kamaytiradi.",
          "Har bir mashq sessiyasidan so'ng, xato qilingan savollarni alohida qayta ko'rib chiqish — shunchaki yangi savollar yechishdan ko'ra ko'proq foyda beradi.",
        ],
      },
      {
        heading: "Real imtihon sharoitini simulyatsiya qiling",
        paragraphs: [
          "Tayyorgarlikning so'nggi bosqichida vaqt chegaralangan, real imtihon formatidagi testlarni ishlash muhim. Bu nafaqat bilimni, balki vaqtni to'g'ri taqsimlash ko'nikmasini ham rivojlantiradi — imtihon kunida asabiylashish tufayli vaqtdan yutqazish odatiy holdir.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Test ishlash", path: "/test-ishlash" },
      { label: "Video darsliklar", path: "/darslik" },
      { label: "Qo'shimcha maslahatlar", path: "/qoshimcha" },
    ],
  },
  {
    slug: "avto-testdan-muvaffaqiyatli-otish",
    title: "Avto Testdan Qanday Muvaffaqiyatli O'tish Mumkin?",
    seoTitle: "Avto Testdan Muvaffaqiyatli O'tish — Amaliy Maslahatlar",
    seoDescription:
      "Avto testdan birinchi urinishdayoq muvaffaqiyatli o'tish uchun amaliy strategiyalar va e'tiborga olish kerak bo'lgan jihatlar.",
    excerpt: "Avto testdan birinchi urinishda o'tish imkoniyatini oshiradigan amaliy strategiyalar.",
    publishedDate: "2026-07-15",
    keywords: "avto testdan o'tish, imtihon strategiyasi, YHQ test",
    sections: [
      {
        heading: "Savolni oxirigacha diqqat bilan o'qing",
        paragraphs: [
          "Ko'plab xatolar savolni to'liq o'qib chiqmasdan javob tanlashdan kelib chiqadi. Ayniqsa \"taqiqlanmaydi\", \"ruxsat etilmaydi\" kabi inkor so'zlar ishtirok etgan savollarda diqqatni jamlash zarur — bunday savollarda mantiq teskari bo'lishi mumkin.",
        ],
      },
      {
        heading: "Ishonchli javoblardan boshlang",
        paragraphs: [
          "Test davomida barcha savollarni ketma-ket yechish shart emas. Avval ishonchli bilgan savollaringizga javob bering, keyin qiyinroq savollarga qayting. Bu vaqtni oqilona taqsimlashga va stressni kamaytirishga yordam beradi.",
        ],
      },
      {
        heading: "Taxmin qilishdan qo'rqmang, lekin asossiz taxmin qilmang",
        paragraphs: [
          "Agar ikkita javob orasida ikkilanayotgan bo'lsangiz, mantiqiy fikrlash orqali noto'g'ri variantni chetlab o'ting va qolgan ikkitasidan tanlang. Bu — hech qanday javob bermaslikka qaraganda ancha samarali strategiya.",
        ],
      },
      {
        heading: "Imtihondan oldingi kechada dam oling",
        paragraphs: [
          "Imtihondan bir kecha oldin yangi mavzularni o'rganishga urinish ko'pincha aksincha ta'sir qiladi — charchoq va uyqusizlik diqqatni pasaytiradi. Buning o'rniga, allaqachon bilgan mavzularingizni qisqacha qayta ko'rib chiqish va yetarlicha dam olish tavsiya etiladi.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Avto Test 20 Savol", path: "/avto-test-20-savol" },
      { label: "Test natijalarim", path: "/profile" },
      { label: "Mavzuli testlar", path: "/mavzuli" },
    ],
  },
  {
    slug: "haydovchilik-imtihonida-eng-kop-xatolar",
    title: "Haydovchilik Imtihonida Eng Ko'p Uchraydigan Xatolar",
    seoTitle: "Haydovchilik Imtihonida Eng Ko'p Uchraydigan Xatolar",
    seoDescription:
      "Haydovchilik guvohnomasi imtihonida nomzodlar ko'proq yo'l qo'yadigan xatolar va ulardan qanday saqlanish mumkinligi.",
    excerpt: "Nomzodlar imtihonda eng ko'p yo'l qo'yadigan xatolar va ulardan qanday saqlanish mumkinligi.",
    publishedDate: "2026-07-10",
    keywords: "haydovchilik imtihoni xatolari, avto test xatolari",
    sections: [
      {
        heading: "Yo'l belgilarini chalkashtirish",
        paragraphs: [
          "Bir-biriga o'xshash belgilarni (masalan, ogohlantiruvchi va taqiqlovchi belgilar) farqlay olmaslik — eng keng tarqalgan xatolardan biri. Bu muammoni yechishning eng samarali yo'li — belgilarni alohida guruhlarga (ogohlantiruvchi, taqiqlovchi, buyuruvchi, ko'rsatuvchi) ajratib, har bir guruhni alohida yodlash.",
        ],
      },
      {
        heading: "Imtiyozli o'tish qoidalarida chalkashish",
        paragraphs: [
          "Bir nechta transport vositasi bir vaqtning o'zida chorrahaga yaqinlashganda, kimga birinchi navbatda yo'l berilishini aniqlash — ko'pchilik uchun qiyin mavzu. Bu qoidalarni faqat yodlab emas, balki har bir vaziyatni chizma yoki video orqali vizual tasavvur qilib o'rganish tavsiya etiladi.",
        ],
      },
      {
        heading: "Vaqtni noto'g'ri taqsimlash",
        paragraphs: [
          "Ba'zi nomzodlar bitta qiyin savolga haddan tashqari ko'p vaqt sarflab, keyingi savollarga yetarli vaqt qoldirmaydi. Agar savol ustida 30 soniyadan ortiq o'ylab ham javobga aniq ishonch hosil qilolmasangiz, eng mantiqiy variantni belgilab, keyingi savolga o'ting.",
        ],
      },
      {
        heading: "Faqat yodlashga tayanish",
        paragraphs: [
          "Savollarni tushunmasdan, faqat javob variantlarini yodlab olish — savollar tartibi yoki matni biroz o'zgarganda darhol muammoga aylanadi. Qoidaning mantig'ini tushunish, uni turli xil savol shakllariga qo'llay olishni ta'minlaydi.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Yo'l belgilari", path: "/belgilar" },
      { label: "Mavzuli testlar", path: "/mavzuli" },
      { label: "Video darsliklar", path: "/darslik" },
    ],
  },
  {
    slug: "yhq-test-savollari",
    title: "YHQ Test Savollari — Qanday Tuzilgan va Nimalarni Qamrab Oladi?",
    seoTitle: "YHQ Test Savollari — To'liq Ma'lumot",
    seoDescription:
      "YHQ (yo'l harakati qoidalari) test savollari qanday mavzularni qamrab oladi va ularga qanday tayyorlanish samarali.",
    excerpt: "YHQ test savollari qaysi mavzularni qamrab oladi va ularga qanday tayyorlanish kerak.",
    publishedDate: "2026-07-05",
    keywords: "YHQ testlari, yo'l harakati qoidalari, YHQ savollari",
    sections: [
      {
        heading: "YHQ testi nimalardan iborat?",
        paragraphs: [
          "YHQ (Yo'l Harakati Qoidalari) testi — haydovchilik guvohnomasi olish uchun topshiriladigan nazariy imtihonning asosini tashkil qiladi. Test yo'l belgilari, yo'l chizig'i, chorrahalardan o'tish tartibi, imtiyozli o'tish qoidalari, to'xtash va turish taqiqlari, jarima va javobgarlik, hamda birinchi tibbiy yordam asoslari kabi mavzularni o'z ichiga oladi.",
        ],
      },
      {
        heading: "Mavzular bo'yicha taqsimot",
        paragraphs: [
          "Har bir mavzu imtihonda turlicha og'irlikka ega. Yo'l belgilari va chorrahalardan o'tish tartibi odatda eng ko'p savol ajratiladigan mavzular hisoblanadi, shuning uchun tayyorgarlik rejasida ularga alohida vaqt ajratish tavsiya etiladi.",
        ],
      },
      {
        heading: "Savollar formatidagi o'ziga xosliklar",
        paragraphs: [
          "YHQ test savollarining aksariyati bitta to'g'ri javobli formatda beriladi, ba'zilari esa rasm yoki chizma asosida tuziladi — bu esa nafaqat qoidani bilishni, balki uni real vaziyatga qo'llay olishni ham talab qiladi. Shu sababli faqat matnli o'qish emas, balki rasmli va video materiallar bilan ham mashq qilish tavsiya etiladi.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Avto Test 2026", path: "/avto-test-2026" },
      { label: "Yo'l belgilari", path: "/belgilar" },
      { label: "Mavzuli testlar", path: "/mavzuli" },
    ],
  },
  {
    slug: "yol-belgilari-va-manolari",
    title: "Yo'l Belgilari va Ularning Ma'nolari",
    seoTitle: "Yo'l Belgilari va Ularning Ma'nolari — To'liq Qo'llanma",
    seoDescription:
      "Yo'l belgilarining asosiy guruhlari va ularning ma'nolari haqida tushunarli va amaliy qo'llanma — imtihonga tayyorgarlik uchun.",
    excerpt: "Yo'l belgilarining asosiy guruhlari va ularni tez va oson eslab qolish usullari.",
    publishedDate: "2026-06-28",
    keywords: "yo'l belgilari, yo'l belgilari ma'nosi, YHQ belgilari",
    sections: [
      {
        heading: "Yo'l belgilarining asosiy guruhlari",
        paragraphs: [
          "Yo'l belgilari bir necha asosiy guruhga bo'linadi: ogohlantiruvchi belgilar (uchburchak shaklida, xavf haqida oldindan ogohlantiradi), taqiqlovchi belgilar (doira shaklida, muayyan harakatni man etadi), buyuruvchi belgilar (ko'k doira, muayyan harakatni bajarishni talab qiladi) va ko'rsatuvchi/axborot belgilari (to'rtburchak shaklida, yo'nalish yoki joy haqida ma'lumot beradi).",
        ],
      },
      {
        heading: "Shaklga qarab tez farqlash usuli",
        paragraphs: [
          "Belgi ma'nosini eslab qolishning eng samarali usuli — avval uning shakli va rangiga e'tibor berish. Uchburchak, qizil chegarali belgilar deyarli har doim ogohlantiruvchi xarakterga ega. Qizil chegarali, oq fonli doira belgilar esa odatda biror harakatni taqiqlaydi. Bu oddiy qoidani bilish, hatto aniq belgini eslay olmagan taqdirda ham, uning umumiy ma'nosini taxmin qilishga yordam beradi.",
        ],
      },
      {
        heading: "Amalda qanday mashq qilish kerak?",
        paragraphs: [
          "Belgilarni faqat ro'yxat ko'rinishida yodlashdan ko'ra, ularni guruhlar bo'yicha, rasm bilan birga o'rganish ancha samarali. Shuningdek, mavzuli test rejimida faqat \"Yo'l belgilari\" mavzusi bo'yicha muntazam mashq qilish, xotirada mustahkam saqlanib qolishiga yordam beradi.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Yo'l belgilari bo'limi", path: "/belgilar" },
      { label: "Mavzuli testlar", path: "/mavzuli" },
      { label: "Test ishlash", path: "/test-ishlash" },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return blogArticles.find((a) => a.slug === slug);
}