import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://bepelican.com";

const STATIC_ROUTES = [
  "/",
  "/experiencias",
  "/libreria",
  "/privacidad",
];

const CATEGORY_SLUGS = [
  "experiencias-urbanas",
  "gastronomia",
  "historia-patrimonio",
  "naturaleza-y-deporte",
  "turismo-rural",
];

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: experiences }, { data: flipbooks }] = await Promise.all([
    supabase.from("experiences").select("slug, updated_at").eq("status", "activa"),
    supabase.from("flipbooks").select("slug, updated_at").eq("status", "published"),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const urls: string[] = [];

  // Static routes
  for (const route of STATIC_ROUTES) {
    urls.push(`  <url><loc>${BASE_URL}${route}</loc><lastmod>${today}</lastmod></url>`);
  }

  // Category routes
  for (const slug of CATEGORY_SLUGS) {
    urls.push(`  <url><loc>${BASE_URL}/experiencias?categoria=${slug}</loc><lastmod>${today}</lastmod></url>`);
  }

  // Dynamic experience routes
  if (experiences) {
    for (const exp of experiences) {
      const lastmod = exp.updated_at ? exp.updated_at.split("T")[0] : today;
      urls.push(`  <url><loc>${BASE_URL}/experiencia/${exp.slug}</loc><lastmod>${lastmod}</lastmod></url>`);
    }
  }

  // Dynamic flipbook routes
  if (flipbooks) {
    for (const fb of flipbooks) {
      const lastmod = fb.updated_at ? fb.updated_at.split("T")[0] : today;
      urls.push(`  <url><loc>${BASE_URL}/libreria/${fb.slug}</loc><lastmod>${lastmod}</lastmod></url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
});
