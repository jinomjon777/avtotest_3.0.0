import { useState } from "react";
import { Play } from "lucide-react";
import { getVideoTitle } from "@/data/videoDarslar";
import { VideoModal } from "./VideoModal";

interface VideoPlayerProps {
  url: string;
  index: number;
}

export function VideoPlayer({ url, index }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const title = getVideoTitle(url);

  return (
    <>
      <button
        onClick={() => setIsPlaying(true)}
        className="group flex items-center gap-2.5 w-full p-2 rounded-lg bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200 text-left"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-105 transition-all duration-200">
          <Play className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground ml-0.5 transition-colors" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {index + 1}. {title}
          </p>
        </div>
      </button>

      {isPlaying && (
        <VideoModal
          url={url}
          index={index}
          onClose={() => setIsPlaying(false)}
        />
      )}
    </>
  );
}
