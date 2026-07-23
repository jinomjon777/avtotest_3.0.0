import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Yangi deploydan keyin, brauzerda ochiq turgan eski sahifa endi mavjud
// bo'lmagan (eski hash nomli) JS bo'lagini so'rashi mumkin — bu "Failed to
// fetch dynamically imported module" xatosiga olib keladi. Bunday holatda
// sahifani avtomatik qayta yuklaymiz — foydalanuvchi hech narsa qilmasdan
// eng yangi versiyani oladi. Cheksiz aylanishning oldini olish uchun
// sessiya davomida faqat bir marta qayta yuklanadi.
window.addEventListener("vite:preloadError", () => {
  const key = "reloaded-after-chunk-error";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);