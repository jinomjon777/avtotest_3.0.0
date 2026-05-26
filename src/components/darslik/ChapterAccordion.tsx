import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VideoChapter } from "@/data/videoDarslar";
import { VideoPlayer } from "./VideoPlayer";

interface ChapterAccordionProps {
  chapters: VideoChapter[];
}

export function ChapterAccordion({ chapters }: ChapterAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      {chapters.map((chapter, chapterIndex) => {
        const isExpanded = expandedItems.includes(`chapter-${chapterIndex}`);

        return (
          <Accordion
            key={chapterIndex}
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
          >
             <AccordionItem
              value={`chapter-${chapterIndex}`}
              className={`border rounded-lg overflow-hidden shadow-sm transition-all duration-200 ${
                isExpanded 
                  ? "border-primary/50 bg-card shadow-md ring-1 ring-primary/20" 
                  : "border-border bg-card"
              }`}
            >
              <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2.5 text-left">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                    isExpanded
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {chapterIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-xs md:text-sm leading-tight truncate transition-colors duration-200 ${
                      isExpanded ? "text-primary" : "text-foreground"
                    }`}>
                      {chapter.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {chapter.data.length} ta video
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-2.5">
                {isExpanded && (
                  <div className="max-h-64 overflow-y-auto space-y-1 pt-1 pr-1 custom-scrollbar">
                    {chapter.data.map((videoUrl, videoIndex) => (
                      <VideoPlayer
                        key={videoIndex}
                        url={videoUrl}
                        index={videoIndex}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </div>
  );
}
