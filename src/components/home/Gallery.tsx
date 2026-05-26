import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";

// Placeholder images - bu yerda haqiqiy rasmlar qo'yiladi
const galleryItems = [
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600",
    title: "Amaliy mashg'ulot",
    description: "Professional instruktor bilan haydashni o'rganish",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
    title: "Zamonaviy avtomobillar",
    description: "O'qitish uchun qulay va xavfsiz mashinalar",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600",
    title: "Sifatli ta'lim",
    description: "Yuqori standartlarga mos o'qitish jarayoni",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600",
    title: "Tajriba maydoni",
    description: "Xavfsiz muhitda amaliy ko'nikmalar",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600",
    title: "Muvaffaqiyatli bitiruvchilar",
    description: "Minglab mamnun o'quvchilar",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600",
    title: "Nazariy darslar",
    description: "YHQ bo'yicha batafsil tushuntirishlar",
  },
];

export function Gallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openModal = (index: number) => setSelectedIndex(index);
  const closeModal = () => setSelectedIndex(null);
  
  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % galleryItems.length);
    }
  };
  
  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + galleryItems.length) % galleryItems.length);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Galereya
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            O'quv markazi va ta'lim jarayonidan suratlar
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <Card 
              key={index}
              className="group cursor-pointer overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300"
              onClick={() => openModal(index)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="text-primary-foreground">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm opacity-90">{item.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 w-12 h-12 bg-card/10 hover:bg-card/20 rounded-full flex items-center justify-center text-primary-foreground transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 w-12 h-12 bg-card/10 hover:bg-card/20 rounded-full flex items-center justify-center text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 w-12 h-12 bg-card/10 hover:bg-card/20 rounded-full flex items-center justify-center text-primary-foreground transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryItems[selectedIndex].src}
              alt={galleryItems[selectedIndex].title}
              className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
            />
            <div className="mt-4 text-center text-primary-foreground">
              <h3 className="text-xl font-semibold">{galleryItems[selectedIndex].title}</h3>
              <p className="text-primary-foreground/70">{galleryItems[selectedIndex].description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
