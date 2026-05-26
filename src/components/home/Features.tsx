import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  Shield, 
  TrendingUp, 
  Clock, 
  Users, 
  Award,
  BookOpen,
  Target
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Qulay interfeys",
    description: "Telefon, planshet yoki kompyuterda ishlash imkoniyati",
    color: "bg-blue-500",
  },
  {
    icon: Shield,
    title: "Rasmiy savollar",
    description: "O'zbekiston YHQ ga asoslangan test savollari",
    color: "bg-green-500",
  },
  {
    icon: TrendingUp,
    title: "Statistika",
    description: "O'z natijalaringizni kuzatib boring",
    color: "bg-purple-500",
  },
  {
    icon: Clock,
    title: "24/7 kirish",
    description: "Istalgan vaqtda test ishlash imkoniyati",
    color: "bg-orange-500",
  },
  {
    icon: Users,
    title: "Professional o'qituvchilar",
    description: "Tajribali va malakali instruktorlar jamoasi",
    color: "bg-pink-500",
  },
  {
    icon: Award,
    title: "100% natija",
    description: "O'quvchilarimizning muvaffaqiyati kafolati",
    color: "bg-cyan-500",
  },
  {
    icon: BookOpen,
    title: "Zamonaviy darsliklar",
    description: "Eng so'nggi YHQ yangilanishlari bilan",
    color: "bg-indigo-500",
  },
  {
    icon: Target,
    title: "Aniq maqsad",
    description: "Imtihondan muvaffaqiyatli o'tishga yo'naltirilgan",
    color: "bg-rose-500",
  },
];

export function Features() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nima uchun bizni tanlash kerak?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Platformamiz sizga eng yaxshi tayyorgarlik imkoniyatini beradi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 border-none bg-card hover:-translate-y-1"
              >
                <CardContent className="pt-8 pb-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
