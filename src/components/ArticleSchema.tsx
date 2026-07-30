import { Helmet } from "react-helmet-async";

interface ArticleSchemaProps {
  title: string;
  description: string;
  path: string;
  publishedDate: string;
}

const BASE_URL = "https://smartavto.uz";

export function ArticleSchema({ title, description, path, publishedDate }: ArticleSchemaProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${BASE_URL}${path}`,
    datePublished: publishedDate,
    dateModified: publishedDate,
    inLanguage: "uz",
    publisher: {
      "@type": "Organization",
      name: "Smartavto.uz",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo-premium.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}${path}`,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}