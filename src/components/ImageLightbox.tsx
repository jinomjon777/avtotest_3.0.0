import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

/**
 * Rasm kattalashtirish: rasm ustiga bosilganda ochiladi.
 * Faqat kattalashganda X tugmasi ko'rinadi. Ekranga (yoki X ga) bir marta bosilganda yopiladi.
 */
export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!imageUrl) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClose()}
      aria-label="Rasmni yopish"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Yopish"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={imageUrl}
        alt="Kattalashtirilgan rasm"
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}
