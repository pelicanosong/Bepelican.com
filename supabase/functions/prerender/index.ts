import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://bepelican.com";
const OG_IMAGE = "https://bepelican.com/images/og-bepelican.png";

const BOT_AGENTS =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|telegram|discord/i;

function buildHtml(meta: {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}): string {
  const escaped = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${escaped(meta.title)}</title>
  <meta name="description" content="${escaped(meta.description)}"/>
  <link rel="canonical" href="${escaped(meta.url)}"/>

  <meta property="og:type" content="${meta.type}"/>
  <meta property="og:title" content="${escaped(meta.title)}"/>
  <meta property="og:description" content="${escaped(meta.description)}"/>
  <meta property="og:url" content="${escaped(meta.url)}"/>
  <meta property="og:image" content="${escaped(meta.image)}"/>
  <meta property="og:site_name" content="BePelican"/>
  <meta property="og:locale" content="es_CO"/>

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escaped(meta.title)}"/>
  <meta name="twitter:description" content="${escaped(meta.description)}"/>
  <meta name="twitter:image" content="${escaped(meta.image)}"/>
  ${
    meta.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`
      : ""
  }
  <meta http-equiv="refresh" content="0;url=${escaped(meta.url)}"/>
</head>
<body>
  <p><a href="${escaped(meta.url)}">${escaped(meta.title)}</a></p>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  const userAgent = req.headers.get("user-agent") || "";

  // Only serve prerendered HTML to bots
  if (!BOT_AGENTS.test(userAgent)) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: `${BASE_URL}${path}` },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  let meta = {
    title: "BePelican | Experiencias de turismo auténtico en Colombia",
    description:
      "Descubre experiencias únicas de turismo en Colombia con BePelican. Aventuras, cultura, gastronomía y naturaleza con comunidades locales.",
    url: BASE_URL,
    image: OG_IMAGE,
    type: "website",
    jsonLd: undefined as Record<string, unknown> | Record<string, unknown>[] | undefined,
  };

  // /experiencia/:slug
  const expMatch = path.match(/^\/experiencia\/([^/]+)\/?$/);
  if (expMatch) {
    const slug = expMatch[1];
    const { data } = await supabase
      .from("experiences")
      .select(
        "title, short_description, description, cover_image, slug, price, location_name, location_city, location_department, location_country, max_participants, duration_minutes"
      )
      .eq("slug", slug)
      .eq("status", "activa")
      .maybeSingle();

    if (data) {
      meta.title = `${data.title} | Experiencia en Colombia | BePelican`;
      meta.description = `Descubre la experiencia ${data.title} en Colombia con BePelican. Turismo auténtico con comunidades locales.`;
      meta.url = `${BASE_URL}/experiencia/${data.slug}`;
      meta.image = data.cover_image || OG_IMAGE;
      meta.type = "article";
      meta.jsonLd = {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: data.title,
        description: data.short_description || data.description?.substring(0, 300),
        image: data.cover_image,
        url: meta.url,
        offers: {
          "@type": "Offer",
          price: data.price,
          priceCurrency: "COP",
          availability: "https://schema.org/InStock",
        },
        location: {
          "@type": "Place",
          name: data.location_name,
          address: {
            "@type": "PostalAddress",
            addressLocality: data.location_city,
            addressRegion: data.location_department,
            addressCountry: data.location_country || "CO",
          },
        },
        maximumAttendeeCapacity: data.max_participants,
      };
    }
  }

  // /experiencias
  if (path === "/experiencias" || path.startsWith("/experiencias?")) {
    meta.title = "Experiencias en Colombia | BePelican";
    meta.description =
      "Descubre experiencias únicas en Colombia con BePelican. Turismo auténtico, aventuras y cultura con comunidades locales.";
    meta.url = `${BASE_URL}/experiencias`;
  }

  // /libreria/:slug (incluye alias → slug canónico en Supabase)
  const FLIPBOOK_SLUG_ALIASES: Record<string, string> = {
    "huellas-boyaca-territorio-de-cocteles-sagrados": "boyaca-tierra-de-cocteles-sagrados",
  };
  const libMatch = path.match(/^\/libreria\/([^/]+)\/?$/);
  if (libMatch) {
    const urlSlug = libMatch[1];
    const slug = FLIPBOOK_SLUG_ALIASES[urlSlug] ?? urlSlug;
    const { data } = await supabase
      .from("flipbooks")
      .select("title, description, cover_image, slug")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (data) {
      meta.title = `${data.title} | Guía de viaje Colombia | BePelican`;
      meta.description =
        data.description?.substring(0, 160) ||
        `Lee ${data.title} en BePelican. Guías de viaje, rutas y experiencias auténticas en Colombia.`;
      meta.url = `${BASE_URL}/libreria/${urlSlug}`;
      meta.image = data.cover_image || OG_IMAGE;
      meta.type = "article";
      meta.jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        name: data.title,
        headline: data.title,
        description: meta.description,
        url: meta.url,
        image: data.cover_image,
        publisher: { "@type": "Organization", name: "BePelican", url: BASE_URL },
      };
    }
  }

  // /libreria
  if (path === "/libreria") {
    meta.title =
      "Guías de viaje de Colombia, rutas y experiencias locales | BePelican";
    meta.description =
      "Descubre guías de viaje de Colombia, rutas locales, gastronomía y experiencias auténticas creadas por BePelican para inspirar tu próximo viaje.";
    meta.url = `${BASE_URL}/libreria`;
  }

  // Home page — add Organization + WebSite schema
  if (path === "/" || path === "") {
    const orgSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BePelican",
      url: BASE_URL,
      logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/mMfcgngu3jRFU47Dmru1iEKsZM03/uploads/1768184182258-1200x1200.png",
      description:
        "Plataforma de turismo auténtico en Colombia. Experiencias con comunidades locales, aventuras, cultura y gastronomía.",
      foundingDate: "2024",
      areaServed: { "@type": "Country", name: "Colombia" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Spanish", "English"],
      },
    };
    const siteSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BePelican",
      url: BASE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/experiencias?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };
    meta.jsonLd = [orgSchema, siteSchema];
  }

  const html = buildHtml(meta);

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
});
