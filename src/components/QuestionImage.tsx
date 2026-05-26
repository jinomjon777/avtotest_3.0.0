import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface QuestionImageProps {
  imageUrl: string;
  altText: string;
}

export const QuestionImage = ({ imageUrl, altText }: QuestionImageProps) => {
  const [loaded, setLoaded] = useState(false);
  // Reset loaded state when imageUrl changes to avoid flash of previous image
  useEffect(() => {
    setLoaded(false);
  }, [imageUrl]);

  return (
    <Card className="w-full max-w-md bg-card border-image-border shadow-sm overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center">
        <img
          key={imageUrl}
          src={imageUrl}
          alt={altText || "Savol rasmi"}
          className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </Card>
  );
};