import BlockBlastGame from "./BlockBlastGame";

// =======================================================
// CONFIGURATION SEO METADATA KHUSUS GAME "BLOCK Q" (PNG)
// =======================================================
export const metadata = {
  title: "BLOCK Q - Main Game Puzzle Balok Klasik Online Gratis",
  description: "Mainkan BLOCK Q online gratis! Game puzzle susun balok paling seru langsung di browser Anda. Hancurkan baris balok, kumpulkan kombo gemilang, pecahkan rekor, dan kuasai papan peringkat TOP 10!",
  keywords: [
    "block q",
    "game block q",
    "block q online",
    "main block q gratis",
    "block puzzle game",
    "game puzzle balok",
    "tetris arcade online",
    "game balok susun",
    "game kasual gratis",
    "rizki ashari"
  ],
  alternates: {
    canonical: "https://block-q.vercel.app", // Sesuaikan dengan domain asli Vercel kamu nanti
  },
  openGraph: {
    title: "BLOCK Q - Main Game Puzzle Balok Klasik Online Gratis",
    description: "Susun balok strategi, picu ledakan kombo, dan amankan rekor tertinggimu di papan peringkat global BLOCK Q!",
    url: "https://block-q.vercel.app", 
    siteName: "BLOCK Q",
    images: [
      {
        url: "/og-image.png", // SEKARANG MENGARAH KE FILE PNG KAMU
        width: 1200,
        height: 630,
        alt: "BLOCK Q Game Banner Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BLOCK Q - Game Puzzle Balok Gratis",
    description: "Mainkan teka-teki balok paling adiktif dengan efek suara menggelegar langsung di perambanmu!",
    images: ["/og-image.png"], // SEKARANG MENGARAH KE FILE PNG KAMU
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "BLOCK Q",
    "description": "Game teka-teki susun balok arkade yang adiktif dengan fitur anti-duplikat rekor papan peringkat lokal.",
    "operatingSystem": "Windows, macOS, Android, iOS, Linux",
    "applicationCategory": "GameApplication",
    "browserRequirements": "Requires HTML5 support and JavaScript enabled",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IDR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "280"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlockBlastGame />
    </>
  );
}