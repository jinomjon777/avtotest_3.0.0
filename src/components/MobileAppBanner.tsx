import { Play } from "lucide-react";

export function MobileAppBanner() {
  return (
    <a
      href="https://play.google.com/store/apps/details?id=com.hoffenuz.Avtotestu&pcampaignid=web_share"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open Avtodars on Google Play"
      className="md:hidden block w-full"
    >
      <div className="w-full bg-emerald-600 text-white rounded-none px-2 py-2 flex items-center justify-between gap-3">
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 2L20 12L3 22V2Z" />
        </svg>

        <div className="flex-1 min-w-0 px-2">
          <div className="font-semibold text-sm leading-tight">Avtodars — Mobil ilova</div>
          <div className="text-[13px] leading-tight opacity-95">Yangi savollarni offline ishlang</div>
        </div>

        <img
          src="/data/rasm32.webp"
          alt="Google Play"
          className="w-32 h-12 object-contain flex-shrink-0"
          loading="lazy"
        />
      </div>
    </a>
  );
}

export default MobileAppBanner;
