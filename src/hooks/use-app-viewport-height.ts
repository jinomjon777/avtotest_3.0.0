import { useEffect } from "react";

/**
 * Mobil brauzerlarda 100vh/100dvh/100svh CSS birliklari turlicha
 * (va ba'zan noto'g'ri) ishlaydi — manzil paneli ko'rinish holatiga
 * qarab "sakrash" yoki bo'sh joy qoldirish kabi muammolarga olib
 * keladi.
 *
 * Bu hook window.innerHeight orqali HAQIQIY ekran balandligini
 * o'lchaydi va --app-vh CSS o'zgaruvchisiga yozadi (1% birlik
 * sifatida). Bu — eski, ammo eng barqaror va universal yechim,
 * barcha brauzerlarda bir xil ishlaydi.
 *
 * Foydalanish: height: calc(var(--app-vh, 1vh) * 100)
 */
export function useAppViewportHeight() {
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--app-vh", `${vh}px`);
    };

    setVh();

    // Faqat haqiqiy o'lcham o'zgarganda (manzil paneli ko'rinish holati
    // almashganda yoki ekran burilganda) yangilaymiz — skroll paytida
    // emas, shu sabab hech qanday "sakrash" bo'lmaydi.
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);
}