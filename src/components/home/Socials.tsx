import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Phone, Instagram } from "lucide-react";

const socials = [
  {
    icon: MessageCircle,
    name: "Telegram Kanal",
    handle: "@avtotestu_ad",
    link: "https://t.me/avtotestu_ad",
    color: "from-blue-400 to-blue-600",
    description: "Yangiliklar va e'lonlar",
  },
  {
    icon: Send,
    name: "Telegram Bot",
    handle: "@Avtotesturganchbot",
    link: "https://t.me/Avtotesturganchbot",
    color: "from-cyan-400 to-cyan-600",
    description: "Avtomatik yordam",
  },
  {
    icon: Phone,
    name: "Maktab Bot",
    handle: "@maktabavtobot",
    link: "https://t.me/maktabavtobot",
    color: "from-green-400 to-green-600",
    description: "O'quv markaz bilan bog'lanish",
  },
];

export function Socials() {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Bizga qo'shiling!
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ijtimoiy tarmoqlarimizda yangiliklar va foydali ma'lumotlardan xabardor bo'ling
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {socials.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-none overflow-hidden hover:-translate-y-1">
                  <div className={`h-2 bg-gradient-to-r ${social.color}`} />
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-r ${social.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">
                      {social.name}
                    </h3>
                    <p className="text-primary font-medium text-sm mb-2">
                      {social.handle}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {social.description}
                    </p>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
