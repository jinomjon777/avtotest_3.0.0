import { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, RectangleHorizontal, Loader2 } from "lucide-react";
import { getVideoUrl, videoErrorMessage } from "@/lib/videoApi";
import { getVideoTitle } from "@/data/videoDarslar";

interface VideoModalProps {
  url: string;
  index: number;
  onClose: () => void;
}

type VideoSize = "compact" | "medium" | "full";

const sizeConfig: Record<VideoSize, { label: string; className: string; icon: typeof Minimize2 }> = {
  compact: {
    label: "Kichik",
    className: "w-[90vw] md:w-[50vw] lg:w-[40vw] max-w-2xl",
    icon: Minimize2,
  },
  medium: {
    label: "O'rta",
    className: "w-[95vw] md:w-[70vw] lg:w-[60vw] max-w-4xl",
    icon: RectangleHorizontal,
  },
  full: {
    label: "Katta",
    className: "w-[98vw] md:w-[90vw] lg:w-[80vw] max-w-6xl",
    icon: Maximize2,
  },
};

export function VideoModal({ url, index, onClose }: VideoModalProps) {
  const [size, setSize] = useState<VideoSize>("medium");
  const title = getVideoTitle(url);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState("");

  // `url` — video kaliti; haqiqiy (muddatli) havola serverdan olinadi
  useEffect(() => {
    let alive = true;
    setSrc(null);
    setError("");
    getVideoUrl(url)
      .then((u) => { if (alive) setSrc(u); })
      .catch((e) => { if (alive) setError(videoErrorMessage(e)); });
    return () => { alive = false; };
  }, [url]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const sizes: VideoSize[] = ["compact", "medium", "full"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${sizeConfig[size].className} transition-all duration-300 ease-out animate-scale-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-card/95 backdrop-blur-md rounded-t-xl px-4 py-2.5 border border-border/50 border-b-0">
          <p className="text-sm font-medium text-foreground truncate mr-4">
            {index + 1}. {title}
          </p>
          <div className="flex items-center gap-1">
            {sizes.map((s) => {
              const Icon = sizeConfig[s].icon;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`p-1.5 rounded-md transition-colors ${
                    size === s
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={sizeConfig[s].label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={onClose}
              aria-label="Yopish"
              className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="relative rounded-b-xl overflow-hidden bg-black border border-border/50 border-t-0">
          <div className="aspect-video">
            {src ? (
              <video
                src={src}
                controls
                autoPlay
                className="w-full h-full"
                controlsList="nodownload"
                preload="metadata"
                onContextMenu={(e) => e.preventDefault()}
              >
                Brauzeringiz video formatini qo'llab-quvvatlamaydi.
              </video>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/80">
                {error ? <p role="alert">{error}</p> : <Loader2 className="h-8 w-8 animate-spin" aria-label="Yuklanmoqda" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
