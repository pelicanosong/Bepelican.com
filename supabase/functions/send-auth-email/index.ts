/**
 * Supabase Auth Hook: Send Email → Resend (templates BePelican)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-signature",
};

type EmailActionType = "signup" | "recovery" | "email_change" | "magic_link" | "invite";

interface HookPayload {
  user: {
    email: string;
    user_metadata?: {
      first_name?: string;
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url: string;
  };
}

const templateCache = new Map<string, string>();

async function loadTemplate(name: string) {
  if (templateCache.has(name)) return templateCache.get(name)!;
  const path = new URL(`./templates/${name}.html`, import.meta.url);
  const html = await Deno.readTextFile(path);
  templateCache.set(name, html);
  return html;
}

function firstName(user: HookPayload["user"]) {
  return (
    user.user_metadata?.first_name ||
    user.user_metadata?.full_name?.split(" ")[0] ||
    "viajero"
  );
}

function authUrl(payload: HookPayload) {
  const site = Deno.env.get("SITE_URL") || payload.email_data.site_url || "https://bepelican.com";
  const { token_hash, email_action_type, redirect_to } = payload.email_data;
  const type = email_action_type === "recovery" ? "recovery" : "signup";
  const redirect = encodeURIComponent(redirect_to || `${site}/mi-cuenta`);
  return `${site}/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${redirect}`;
}

function personalizeHtml(html: string, name: string, actionUrl?: string) {
  let out = html.replace(/Nicolas/g, name).replace(/viajero/g, name);
  if (actionUrl) {
    out = out.replace(/https:\/\/bepelican\.com\/[^"']+/g, actionUrl);
    out = out.replace(/https:\/\/bepelican\.com/auth\/callback\?token=example/g, actionUrl);
    out = out.replace(/https:\/\/bepelican\.com\/login\?reset=example/g, actionUrl);
  }
  return out;
}

async function sendResend(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "BePelican <onboarding@resend.dev>";
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as HookPayload;
    const { user, email_data } = payload;
    const name = firstName(user);
    const url = authUrl(payload);
    const action = email_data.email_action_type;

    let subject = "BePelican";
    let template = "welcome";

    switch (action) {
      case "signup":
      case "invite":
      case "email_change":
        subject = action === "recovery" ? subject : "Confirmá tu cuenta en BePelican";
        template = "confirm-signup";
        break;
      case "recovery":
        subject = "Restablecé tu contraseña — BePelican";
        template = "reset-password";
        break;
      default:
        subject = "Bienvenido a BePelican";
        template = "welcome";
    }

    const raw = await loadTemplate(template);
    const html = personalizeHtml(raw, name, template !== "welcome" ? url : undefined);
    await sendResend(user.email, subject, html);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-auth-email:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
