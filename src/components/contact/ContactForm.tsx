import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, MessageCircle, Send, User, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

type ContactMethod = "phone" | "telegram";

export function ContactForm() {
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const formatPhone = (v: string) => setPhone(v.replace(/\D/g, "").substring(0, 9));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const contactValue = contactMethod === "phone" ? `+998${phone}` : `@${telegram.replace(/^@/, '')}`;
      const { error } = await supabase.from('contact_messages').insert({
        name: name.trim(), phone: contactValue, subject: `Aloqa: ${contactMethod.toUpperCase()}`, message: message.trim(), user_id: user?.id || null
      });
      if (error) throw error;
      toast({ title: t("contact.toastSuccess"), description: t("contact.toastSuccessDesc") });
      setName(""); setPhone(""); setTelegram(""); setMessage("");
    } catch (err) {
      toast({ title: t("contact.toastError"), description: t("contact.toastErrorDesc"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // flex flex-col h-full va eng pastki elementni mt-auto qilib beramiz
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      
      {/* Sarlavha */}
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <MessageCircle className="w-5 h-5 text-primary" />
          {t("contact.formTitle")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("contact.formSubtitle")}
        </p>
      </div>

      <div className="space-y-5 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs">{t("contact.labelName")}</Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("contact.placeholderName")}
                className="pl-10 h-11 bg-muted/30 focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs">{t("contact.labelContactMethod")}</Label>
            <div className="flex p-1 bg-muted/50 rounded-md h-11">
              <button
                type="button"
                onClick={() => setContactMethod("phone")}
                className={`flex-1 flex items-center justify-center gap-2 rounded text-sm font-medium transition-all ${
                  contactMethod === "phone" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> {t("contact.contactPhone")}
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("telegram")}
                className={`flex-1 flex items-center justify-center gap-2 rounded text-sm font-medium transition-all ${
                  contactMethod === "telegram" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> {t("contact.contactTelegram")}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs">
            {contactMethod === "phone" ? t("contact.labelPhone") : t("contact.labelTelegramUser")}
          </Label>
          <div className="flex shadow-sm">
            <div className="flex items-center justify-center px-4 bg-muted/50 border border-r-0 border-input rounded-l-md text-sm font-bold text-muted-foreground">
              {contactMethod === "phone" ? "+998" : "@"}
            </div>
            <Input
              type={contactMethod === "phone" ? "tel" : "text"}
              value={contactMethod === "phone" ? phone : telegram}
              onChange={(e) => contactMethod === "phone" ? formatPhone(e.target.value) : setTelegram(e.target.value)}
              placeholder={contactMethod === "phone" ? t("contact.placeholderPhone") : t("contact.placeholderTelegram")}
              className="rounded-l-none h-11 bg-muted/30 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs">{t("contact.labelMessage")}</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("contact.placeholderMessage")}
            className="min-h-[120px] bg-muted/30 resize-none focus:ring-2 focus:ring-primary/20 p-3"
            required
          />
        </div>
      </div>

      {/* mt-auto tugmani doim pastga tortadi */}
      <div className="mt-8 pt-4 border-t border-muted">
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-12 font-bold shadow-md hover:-translate-y-0.5 transition-transform"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("contact.btnSending")}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {t("contact.btnSubmit")}
            </div>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500" /> 
          {t("contact.privacyNote")}
        </p>
      </div>

    </form>
  );
}