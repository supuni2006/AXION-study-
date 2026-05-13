import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  provider: z.string().min(1).max(40),
  stage: z.enum(["initiate", "callback", "set_session", "unknown"]).default("unknown"),
  errorCode: z.string().max(120).nullable().optional(),
  errorMessage: z.string().max(2000).nullable().optional(),
  userId: z.string().max(120).nullable().optional(),
  email: z.string().max(320).nullable().optional(),
  redirectUri: z.string().max(2000).nullable().optional(),
  url: z.string().max(2000).nullable().optional(),
});

export const logOAuthFailure = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const entry = {
      kind: "oauth_failure",
      timestamp: new Date().toISOString(),
      provider: data.provider,
      stage: data.stage,
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
      userId: data.userId ?? null,
      email: data.email ?? null,
      redirectUri: data.redirectUri ?? null,
      url: data.url ?? null,
      ip: (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })(),
      userAgent: (() => { try { return getRequestHeader("user-agent") ?? null; } catch { return null; } })(),
      referer: (() => { try { return getRequestHeader("referer") ?? null; } catch { return null; } })(),
    };
    // Structured single-line log for easy grep in server logs.
    console.error(`[oauth_failure] ${JSON.stringify(entry)}`);
    return { ok: true };
  });
