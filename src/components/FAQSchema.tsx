import { Helmet } from "react-helmet-async";

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQPage structured data — FAQATgina sahifada foydalanuvchiga
 * KO'RINADIGAN, haqiqiy savol-javoblar uchun ishlatilishi kerak
 * (Google siyosati). Soxta yoki yashirin FAQ qo'shmang.
 */
export function FAQSchema({ items }: { items: FAQItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}