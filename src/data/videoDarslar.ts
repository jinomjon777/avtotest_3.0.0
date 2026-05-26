export interface VideoChapter {
  title: string;
  data: string[];
}

// Chapter order as specified by requirements
const CHAPTER_ORDER = [
  "Umumiy qoidalar",
  "Ogohlantiruvchi belgilar",
  "Taqiqlovchi belgilar",
  "Buyuruvchi belgilar",
  "Qo'shimcha axborot belgilari",
  "Imtiyoz belgilari",
  "Servis belgilari",
  "Yo'l chiziqlari",
  "Haydovchining huquqiy javobgarligi",
  "Yo'l harakati sohasidagi qonunchilik asoslari",
  "Axborot-ko'rsatkich belgilari",
];

// Raw data from malumotlar.json
const rawChapters: VideoChapter[] = [
  {
    title: "Axborot-ko'rsatkich belgilari",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.10.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.10.2-5.10.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.10.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.11.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.11.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.12-5.15.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.16.1,%205.16.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.17.1-5.17.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.18.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.19.1-5.19.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.20.1,%205.20.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.20.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.21.1,%205.21.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.22.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.23.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.24.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.25.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.26.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.27.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.28.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.29.1,%205.29.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.30.1-5.30.3.mp4",
    ],
  },
  {
    title: "Buyuruvchi belgilar",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.1.1-4.1.6%20davomi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.1.1-4.1.6.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.2.1-4.2.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.5.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.5.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.6.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.7.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.8.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.9.1.mp4",
    ],
  },
  {
    title: "Haydovchining huquqiy javobgarligi",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/5.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/7.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/8.mp4",
    ],
  },
  {
    title: "Imtiyoz belgilari",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.3.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.3.2%2C%202.3.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.5.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.6.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.7.mp4",
    ],
  },
  {
    title: "Ogohlantiruvchi belgilar",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.10.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.11.1%2C%201.11.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.12.1%2C%201.12.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.13.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.14.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.15.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.16.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.17.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.18.1-1.18.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.19.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.20.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.21.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.22.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.23.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.24.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.25.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.26.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.27.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.28.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.29.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.30.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.31.1%2C%201.31.2.mp4",
    ],
  },
  {
    title: "Qo'shimcha axborot belgilari",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.1.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.1.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.1.3%2C%207.1.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.10.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.11.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.12.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.13.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.14.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.15.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.16.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.17.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.18.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.19.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.2.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.2.2%20-%207.2.6.mp4",
    ],
  },
  {
    title: "Servis belgilari",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.10.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.11.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.12.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.13.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.14.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.15.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.5.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.6.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.7.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.8.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.9.mp4",
    ],
  },
  {
    title: "Taqiqlovchi belgilar",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.10.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.11.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.12.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.13.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.14.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.15.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.16.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.17.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.17.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.18.1%2C%203.18.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.19.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.20.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.21.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.22.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.23.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.24.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.25.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.26.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.27.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.3.mp4",
    ],
  },
  {
    title: "Yo'l chiziqlari",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.4.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.6.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.10.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.11.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.12.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.13.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.14.1.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.14.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.14.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.15.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.16.1-1.16.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.17.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.18.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.19.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.2.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.20.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.21.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.22.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.23.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.24.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.25.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.26.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.27.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.28.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.3.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.4.mp4",
    ],
  },
  {
    title: "Yo'l harakati sohasidagi qonunchilik asoslari",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20harakati%20sohasidagi%20qonunchilik%20asoslari/1.mp4",
    ],
  },
  {
    title: "Umumiy qoidalar",
    data: [
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Aholi%20punkti.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Ajratuvchi%20bo'lak.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Arava.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Asosiy%20yo'l.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Avtomagistral.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Avtopoezd.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Bolalar%20guruhini%20tashkiliy%20tashish.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/CHorraha.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Foto%20va%20video%20qayd%20etish.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Haqiqiy%20vazn.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Harakatlanish%20bo'lagi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Haydovchi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Imtiyoz.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Majburiy%20to'xtash.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Mexanik%20transport%20vositasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Moped.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Mototsikl.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Ogohlantiruvchi%20ishoralar.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyoda.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyodalar%20o'tish%20joyi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyodalar%20yo'lkasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyodalarning%20tashkiliy%20jamlanmasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Qatnov%20qismi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Qorong'i%20vaqt.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Quvib%20o'tish.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Reversiv%20harakat.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Ruxsat%20etilgan%20to'la%20vazn.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Tartibga%20soluvchi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Temir%20yo'l%20kesishmasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Tirkama.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/To'xtab%20turish.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/To'xtash.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Transport%20vositalarining%20tashkiliy%20jamlanmasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Transport%20vositasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Transport%20vositasining%20egasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Trotuar.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Velosiped.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yetarlicha%20ko'rinmaslik.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20berish.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati%20qatnashchisi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati%20xavfsizligi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati%20xavfsizligini%20ta'minlash.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakatini%20tashkil%20etish.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20yoqasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l-transport%20hodisasi.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l.mp4",
      "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'lovchi.mp4",
    ],
  },
];

/** Extract a readable video title from its URL */
export function getVideoTitle(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    const filename = decoded.split("/").pop() || "";
    return filename.replace(/\.mp4$/i, "");
  } catch {
    return url.split("/").pop()?.replace(/\.mp4$/i, "") || "Video";
  }
}

/** Get chapters sorted in the specified order */
export function getOrderedChapters(): VideoChapter[] {
  const ordered: VideoChapter[] = [];
  
  for (const title of CHAPTER_ORDER) {
    const chapter = rawChapters.find((c) => c.title === title);
    if (chapter) {
      ordered.push(chapter);
    }
  }
  
  // Add any chapters not in the order list at the end
  for (const chapter of rawChapters) {
    if (!CHAPTER_ORDER.includes(chapter.title)) {
      ordered.push(chapter);
    }
  }
  
  return ordered;
}
