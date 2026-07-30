import { Helmet } from "react-helmet-async";

interface Crumb {
  name: string;
  path: string; // "/" yoki "/variant" kabi, domensiz
}

const BASE_URL = "https://smartavto.uz";

/**
 * Google qidiruv natijalarida "breadcrumb" (yo'l) ko'rinishini
 * chiqarish uchun BreadcrumbList structured data (JSON-LD).
 * Har doim "Bosh sahifa" bilan boshlanadi.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const full = [{ name: "Bosh sahifa", path: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: full.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.path}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}