import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://www.avtotestu.uz";
const DEFAULT_OG_IMAGE = `${BASE_URL}/rasm1.webp`;

export function SEO({
  title,
  description,
  path,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: SEOProps) {
  const fullUrl = `${BASE_URL}${path}`;
  const fullTitle = path === "/" ? title : `${title} | Avtotestu`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Avtotestu.uz" />

      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="uz_UZ" />
      <meta property="og:site_name" content="Avtotestu.uz" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Language */}
      <html lang="uz" />
    </Helmet>
  );
}
