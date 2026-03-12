import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type EvolutionRequest = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
};

type IntegrationRow = {
  id: string;
  credentials: Record<string, unknown>;
  enabled: boolean;
} | null;

type BotConfig = {
  auto_reply_enabled: boolean;
  auto_reply_phone: string;
  owner_phone: string;
  auto_reply_prompt: string;
};

type MessageOverride = {
  deleted?: boolean;
  edited_text?: string;
  contact_phone?: string;
  updated_at?: string;
};

type MessageOverrideMap = Record<string, MessageOverride>;
type DeletedConversationMap = Record<string, string>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INTEGRATION_TYPE = "whatsapp_qr";

const stateAliases: Record<string, string> = {
  open: "connected",
  connected: "connected",
  online: "connected",
  ready: "connected",
  close: "disconnected",
  closed: "disconnected",
  disconnected: "disconnected",
  connecting: "connecting",
  connecting_browser: "connecting",
  qrcode: "qrcode",
};

const normalizePhone = (value: string) => String(value || "").replace(/\D/g, "");
const isJid = (value: string) => String(value || "").includes("@");
const isGroupJid = (value: string) => String(value || "").toLowerCase().endsWith("@g.us");

const normalizeContactId = (value: string): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isJid(raw)) return raw.toLowerCase();
  return normalizePhone(raw);
};

const toProviderJid = (contactId: string): string => {
  const normalized = normalizeContactId(contactId);
  if (!normalized) return "";
  if (isJid(normalized)) return normalized;
  return `${normalized}@s.whatsapp.net`;
};

const getContactVariants = (contactId: string): string[] => {
  const normalized = normalizeContactId(contactId);
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);
  const digits = normalizePhone(normalized);
  if (digits && digits !== normalized) variants.add(digits);
  return Array.from(variants);
};

const normalizeState = (payload: any): string => {
  const fromArray = Array.isArray(payload)
    ? payload
        .map((item) => item?.state || item?.status || item?.instance?.state || item?.instance?.status)
        .find((item) => typeof item === "string")
    : null;

  const raw = [
    fromArray,
    payload?.state,
    payload?.status,
    payload?.instance?.state,
    payload?.instance?.status,
    payload?.data?.state,
    payload?.data?.status,
    payload?.connectionState,
  ].find((item) => typeof item === "string");

  const normalized = String(raw || "disconnected").toLowerCase();
  return stateAliases[normalized] || normalized;
};

const extractQrCode = (payload: any): string | null => {
  const qrCandidate = [
    payload?.base64,
    payload?.base64Qr,
    payload?.qrcode,
    payload?.qr,
    payload?.qrCode,
    payload?.code,
    payload?.data?.base64,
    payload?.data?.base64Qr,
    payload?.data?.qrcode,
    payload?.data?.qr,
    payload?.qrcode?.base64,
    payload?.qrcode?.code,
    payload?.qrcode?.value,
  ].find((item) => typeof item === "string" && item.length > 16);

  if (!qrCandidate) return null;
  const qr = String(qrCandidate);

  if (qr.startsWith("data:image")) return qr;
  if (qr.startsWith("http://") || qr.startsWith("https://")) return qr;
  return `data:image/png;base64,${qr}`;
};

const toIsoDate = (value: unknown): string => {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (typeof value === "number") {
    const ms = value > 9999999999 ? value : value * 1000;
    const parsed = new Date(ms);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
};

const extractArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.chats)) return payload.chats;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.response)) return payload.response;
  return [];
};

const normalizeConversation = (item: any) => {
  const rawId =
    item?.remoteJidAlt ||
    item?.remoteJid ||
    item?.jid ||
    item?.id ||
    item?.chatId ||
    item?.phone ||
    item?.key?.remoteJid ||
    item?.lastMessage?.key?.remoteJidAlt ||
    item?.lastMessage?.key?.remoteJid ||
    item?.lastMessage?.key?.participantAlt ||
    "";

  const contactPhone = normalizeContactId(String(rawId));
  if (!contactPhone) return null;

  const lastText =
    item?.lastMessage?.conversation ||
    item?.lastMessage?.body ||
    item?.lastMessage?.text ||
    item?.lastMessage?.message?.conversation ||
    item?.lastMessage?.message?.extendedTextMessage?.text ||
    item?.lastMessageText ||
    item?.last_message ||
    "";

  return {
    contact_phone: contactPhone,
    contact_name: item?.name || item?.pushName || item?.contact?.name || item?.contact_name || contactPhone,
    last_message: String(lastText || ""),
    last_date: toIsoDate(
      item?.updatedAt ||
        item?.timestamp ||
        item?.lastTimestamp ||
        item?.conversationTimestamp ||
        item?.last_date
    ),
    unread: Number(item?.unreadCount || item?.unread || 0),
  };
};

const normalizeProviderMessage = (item: any, contactPhone: string, index: number) => {
  const fromMe = Boolean(item?.key?.fromMe ?? item?.fromMe ?? item?.direction === "outgoing");

  const rawThreadId =
    item?.key?.remoteJidAlt ||
    item?.key?.remoteJid ||
    item?.remoteJidAlt ||
    item?.remoteJid ||
    item?.jid ||
    item?.chatId ||
    contactPhone ||
    "";

  const normalizedThreadId = normalizeContactId(String(rawThreadId)) || normalizeContactId(contactPhone);

  const text =
    item?.message?.conversation ||
    item?.message?.extendedTextMessage?.text ||
    item?.message?.imageMessage?.caption ||
    item?.body ||
    item?.text ||
    item?.message_text ||
    "";

  const rawId = item?.key?.id || item?.id || `${normalizedThreadId || contactPhone}-${index}-${Date.now()}`;

  return {
    id: String(rawId),
    wa_message_id: String(rawId),
    contact_phone: normalizedThreadId,
    contact_name: item?.pushName || item?.contact?.name || null,
    direction: fromMe ? "outgoing" : "incoming",
    message_text: String(text || ""),
    created_at: toIsoDate(item?.messageTimestamp || item?.timestamp || item?.created_at),
    status: String(item?.status || (fromMe ? "sent" : "received")),
    edited: false,
  };
};

const cleanReplyText = (value: unknown): string => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.slice(0, 800);
};

const isLikelyAuthError = (status: number, message: string): boolean => {
  if (status === 401 || status === 403) return true;
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("invalid jwt") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("apikey") ||
    normalized.includes("token")
  );
};

const defaultAutoReply = (incomingText: string): string => {
  const snippet = cleanReplyText(incomingText).slice(0, 180);
  if (!snippet) {
    return "Recebi sua mensagem. Sou o Horus e vou te ajudar com o que precisar.";
  }
  return `Recebi sua mensagem: \"${snippet}\". Sou o Horus e ja estou cuidando disso para voce.`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_FIXED =
      (Deno.env.get("EVOLUTION_INSTANCE_NAME") || Deno.env.get("EVOLUTION_INSTANCE_ID") || "").trim() || null;
    const EVOLUTION_INSTANCE_PREFIX = Deno.env.get("EVOLUTION_INSTANCE_PREFIX") || "horus";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configure EVOLUTION_API_URL e EVOLUTION_API_KEY no Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");
    const baseUrl = EVOLUTION_API_URL.replace(/\/manager\/.*$/i, "").replace(/\/+$/, "");

    const evolutionRequest = async (request: EvolutionRequest) => {
      const headerVariants: Array<Record<string, string>> = [
        {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
          "x-api-key": EVOLUTION_API_KEY,
        },
        {
          "Content-Type": "application/json",
          "x-api-key": EVOLUTION_API_KEY,
        },
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${EVOLUTION_API_KEY}`,
        },
      ];

      let lastError: Error | null = null;

      for (let i = 0; i < headerVariants.length; i++) {
        const response = await fetch(`${baseUrl}${request.path}`, {
          method: request.method,
          headers: headerVariants[i],
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const text = await response.text();
        let json: any = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          json = { raw: text };
        }

        if (response.ok) {
          return json;
        }

        const rawMessage =
          json?.error?.message ||
          json?.message ||
          json?.error ||
          json?.raw ||
          `Falha no provedor WhatsApp (${response.status})`;

        const rawMessageText = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage);
        const normalizedMsg = String(rawMessageText || "").toLowerCase();
        const friendlyMessage = normalizedMsg.includes("invalid jwt")
          ? "Credencial da Evolution API invalida (Invalid JWT). Atualize EVOLUTION_API_KEY no Supabase."
          : String(rawMessageText);

        const err = new Error(friendlyMessage);
        lastError = err;

        const canRetry = i < headerVariants.length - 1 && isLikelyAuthError(response.status, normalizedMsg);
        if (!canRetry) {
          throw err;
        }
      }

      throw lastError || new Error("Falha ao chamar provedor WhatsApp");
    };

    const evolutionTry = async (requests: EvolutionRequest[]) => {
      let lastError: Error | null = null;
      for (const request of requests) {
        try {
          return await evolutionRequest(request);
        } catch (error) {
          lastError = error as Error;
        }
      }
      throw lastError || new Error("Falha ao chamar provedor WhatsApp");
    };

    const getIntegration = async (): Promise<IntegrationRow> => {
      const { data } = await supabase
        .from("user_integrations")
        .select("id, credentials, enabled")
        .eq("user_id", userId)
        .eq("integration_type", INTEGRATION_TYPE)
        .maybeSingle();

      return (data as IntegrationRow) || null;
    };

    const saveIntegration = async (credentialsPatch: Record<string, unknown>, enabled = true) => {
      const current = await getIntegration();
      const credentials = { ...(current?.credentials || {}), ...credentialsPatch };

      if (current?.id) {
        const { error } = await supabase
          .from("user_integrations")
          .update({ credentials, enabled })
          .eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_integrations").insert({
          user_id: userId,
          integration_type: INTEGRATION_TYPE,
          credentials,
          enabled,
        });
        if (error) throw error;
      }

      return credentials;
    };

    const getBotConfig = async (): Promise<BotConfig> => {
      const integration = await getIntegration();
      const credentials = (integration?.credentials || {}) as Record<string, unknown>;

      return {
        auto_reply_enabled: Boolean(credentials.auto_reply_enabled),
        auto_reply_phone: normalizePhone(String(credentials.auto_reply_phone || "")),
        owner_phone: normalizePhone(String(credentials.owner_phone || "")),
        auto_reply_prompt: String(credentials.auto_reply_prompt || "").trim(),
      };
    };

    const setBotConfig = async (payload: any) => {
      const patch = {
        auto_reply_enabled: Boolean(payload?.auto_reply_enabled),
        auto_reply_phone: normalizePhone(String(payload?.auto_reply_phone || "")),
        owner_phone: normalizePhone(String(payload?.owner_phone || "")),
        auto_reply_prompt: cleanReplyText(payload?.auto_reply_prompt || ""),
      };

      await saveIntegration(patch, true);
      return await getBotConfig();
    };

    const getMessageOverrides = (integration: IntegrationRow): MessageOverrideMap => {
      const raw = (integration?.credentials as Record<string, unknown> | undefined)?.message_overrides;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
      return raw as MessageOverrideMap;
    };

    const getDeletedConversations = (integration: IntegrationRow): DeletedConversationMap => {
      const raw = (integration?.credentials as Record<string, unknown> | undefined)?.deleted_conversations;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
      return raw as DeletedConversationMap;
    };

    const normalizeMessageKey = (messageId: string) => String(messageId || "").trim();

    const buildMessageKey = (msg: any): string => {
      const waId = String(msg?.wa_message_id || "").trim();
      if (waId) return `wa:${waId}`;

      const directKey = String(msg?.message_key || "").trim();
      if (directKey) return directKey;

      const id = String(msg?.id || "").trim();
      if (id) return `id:${id}`;

      const fallback = `${msg?.direction || "unknown"}|${msg?.message_text || ""}|${msg?.created_at || ""}`;
      return `tmp:${fallback}`;
    };

    const trimMapByUpdatedAt = <T extends { updated_at?: string }>(mapObj: Record<string, T>, maxItems: number) => {
      const entries = Object.entries(mapObj);
      if (entries.length <= maxItems) return mapObj;

      entries.sort((a, b) => {
        const left = new Date(a[1]?.updated_at || 0).getTime();
        const right = new Date(b[1]?.updated_at || 0).getTime();
        return right - left;
      });

      return Object.fromEntries(entries.slice(0, maxItems));
    };

    const pruneConversationMap = (mapObj: DeletedConversationMap, maxItems: number) => {
      const entries = Object.entries(mapObj);
      if (entries.length <= maxItems) return mapObj;

      entries.sort((a, b) => new Date(b[1] || 0).getTime() - new Date(a[1] || 0).getTime());
      return Object.fromEntries(entries.slice(0, maxItems));
    };

    const ensureRecentOrNotDeletedConversation = (contactPhone: string, lastDate: string, deletedMap: DeletedConversationMap) => {
      const deletedAt = deletedMap[contactPhone];
      if (!deletedAt) return true;

      const deletedTs = new Date(deletedAt).getTime();
      const lastTs = new Date(lastDate || 0).getTime();
      if (!Number.isFinite(lastTs)) return false;
      return lastTs > deletedTs;
    };

    const ensureInstanceName = async () => {
      if (EVOLUTION_INSTANCE_FIXED) {
        const integration = await getIntegration();
        const existing = String(integration?.credentials?.instance_name || "").trim();

        if (existing !== EVOLUTION_INSTANCE_FIXED) {
          await saveIntegration(
            {
              instance_name: EVOLUTION_INSTANCE_FIXED,
              last_state: String(integration?.credentials?.last_state || "disconnected"),
            },
            integration?.enabled ?? true
          );
        }

        return EVOLUTION_INSTANCE_FIXED;
      }

      const integration = await getIntegration();
      const existing = String(integration?.credentials?.instance_name || "").trim();
      if (existing) return existing;

      const generated = `${EVOLUTION_INSTANCE_PREFIX}_${userId.replace(/-/g, "").slice(0, 18)}`;
      await saveIntegration({ instance_name: generated, last_state: "disconnected" }, true);
      return generated;
    };

    const ensureInstanceCreated = async (instanceName: string) => {
      try {
        await evolutionTry([
          {
            method: "POST",
            path: "/instance/create",
            body: {
              instanceName,
              integration: "WHATSAPP-BAILEYS",
              qrcode: true,
              rejectCall: false,
              groupsIgnore: false,
              alwaysOnline: false,
              readMessages: false,
            },
          },
          {
            method: "POST",
            path: "/instance/create",
            body: {
              name: instanceName,
              integration: "WHATSAPP-BAILEYS",
              qrcode: true,
            },
          },
          {
            method: "POST",
            path: "/instances/create",
            body: {
              instanceName,
              integration: "WHATSAPP-BAILEYS",
              qrcode: true,
            },
          },
          {
            method: "POST",
            path: `/instance/start/${instanceName}`,
          },
          {
            method: "POST",
            path: "/instance/start",
            body: { instanceName },
          },
        ]);
      } catch (error: any) {
        const message = String(error?.message || "").toLowerCase();
        if (message.includes("already") || message.includes("exists") || message.includes("exist")) {
          return;
        }
        throw error;
      }
    };

    const getConnectionState = async (instanceName: string) => {
      const statePayload = await evolutionTry([
        { method: "GET", path: `/instance/connectionState/${instanceName}` },
        { method: "GET", path: `/instance/connection-state/${instanceName}` },
        { method: "GET", path: `/instance/state/${instanceName}` },
        { method: "GET", path: `/instance/connection/${instanceName}` },
        { method: "GET", path: `/instance/fetchInstances?instanceName=${instanceName}` },
        { method: "GET", path: "/instance/fetchInstances" },
      ]);
      return normalizeState(statePayload);
    };

    const getQrCode = async (instanceName: string) => {
      const qrPayload = await evolutionTry([
        { method: "GET", path: `/instance/connect/${instanceName}` },
        { method: "POST", path: `/instance/connect/${instanceName}` },
        { method: "POST", path: "/instance/connect", body: { instanceName } },
        { method: "GET", path: `/instance/qrcode/${instanceName}` },
        { method: "GET", path: `/instance/qr/${instanceName}` },
        { method: "GET", path: `/instance/fetchInstances?instanceName=${instanceName}` },
      ]);
      return extractQrCode(qrPayload);
    };

    const generateAutoReply = async (incomingText: string, prompt: string, contactPhone: string) => {
      const fallback = defaultAutoReply(incomingText);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            mode: "no-stream",
            assistantName: "Horus",
            customPrompt: prompt || "Responda de forma breve, clara e util.",
            messages: [
              {
                role: "user",
                content:
                  `Mensagem recebida de ${contactPhone}: "${cleanReplyText(incomingText)}". ` +
                  "Responda em portugues brasileiro, de forma curta e direta, como assistente pessoal Horus.",
              },
            ],
          }),
        });

        if (!response.ok) return fallback;
        const data = await response.json().catch(() => ({}));
        const content = cleanReplyText(data?.content);
        return content || fallback;
      } catch {
        return fallback;
      }
    };

    const syncAutoReply = async (instanceName: string) => {
      const integration = await getIntegration();
      const credentials = (integration?.credentials || {}) as Record<string, unknown>;
      const botConfig = await getBotConfig();

      if (!botConfig.auto_reply_enabled) {
        return { enabled: false, processed: 0, replied: 0, target_phone: botConfig.auto_reply_phone || null };
      }

      let candidatePhones: string[] = [];
      if (botConfig.auto_reply_phone) {
        candidatePhones = [botConfig.auto_reply_phone];
      } else {
        try {
          const providerResponse = await evolutionTry([
            { method: "GET", path: `/chat/findChats/${instanceName}` },
            { method: "GET", path: `/chat/findChats/${instanceName}?page=1&limit=20` },
            { method: "GET", path: `/chat/list/${instanceName}` },
          ]);

          const convs = extractArray(providerResponse)
            .map(normalizeConversation)
            .filter(Boolean)
            .slice(0, 5);

          candidatePhones = convs.map((c: any) => c.contact_phone).filter(Boolean);
        } catch {
          candidatePhones = [];
        }
      }

      if (candidatePhones.length === 0) {
        return { enabled: true, processed: 0, replied: 0, target_phone: botConfig.auto_reply_phone || null };
      }

      const repliedKeys = Array.isArray(credentials.auto_replied_message_keys)
        ? (credentials.auto_replied_message_keys as unknown[]).map((item) => String(item))
        : [];

      let processed = 0;
      let replied = 0;

      for (const phone of candidatePhones) {
        try {
          const jid = `${phone}@s.whatsapp.net`;
          const providerResponse = await evolutionTry([
            { method: "GET", path: `/chat/findMessages/${instanceName}/${jid}` },
            { method: "GET", path: `/chat/messages/${instanceName}/${jid}` },
            {
              method: "POST",
              path: `/chat/findMessages/${instanceName}`,
              body: { remoteJid: jid, limit: 30 },
            },
          ]);

          const providerMessages = extractArray(providerResponse)
            .map((msg, index) => normalizeProviderMessage(msg, phone, index))
            .filter((msg) => msg.message_text.trim().length > 0)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          const latestIncoming = [...providerMessages].reverse().find((msg) => msg.direction === "incoming");
          if (!latestIncoming) continue;

          processed += 1;

          const messageKey = latestIncoming.id || `${phone}|${latestIncoming.message_text}|${latestIncoming.created_at}`;
          if (repliedKeys.includes(messageKey)) continue;

          await supabase.from("whatsapp_messages").insert({
            user_id: userId,
            contact_phone: phone,
            contact_name: latestIncoming.contact_name,
            direction: "incoming",
            message_text: latestIncoming.message_text,
            wa_message_id: latestIncoming.id,
            status: "received",
          });

          const replyText = await generateAutoReply(latestIncoming.message_text, botConfig.auto_reply_prompt, phone);
          if (!replyText) continue;

          const sendResponse = await evolutionTry([
            {
              method: "POST",
              path: `/message/sendText/${instanceName}`,
              body: { number: phone, text: replyText },
            },
            {
              method: "POST",
              path: `/message/sendText/${instanceName}`,
              body: { jid, text: replyText },
            },
            {
              method: "POST",
              path: `/message/sendText/${instanceName}`,
              body: { to: phone, message: replyText },
            },
          ]);

          const waMessageId =
            sendResponse?.key?.id ||
            sendResponse?.data?.key?.id ||
            sendResponse?.message?.id ||
            sendResponse?.id ||
            null;

          await supabase.from("whatsapp_messages").insert({
            user_id: userId,
            contact_phone: phone,
            contact_name: latestIncoming.contact_name,
            direction: "outgoing",
            message_text: replyText,
            wa_message_id: waMessageId,
            status: "auto",
          });

          replied += 1;
          repliedKeys.push(messageKey);
        } catch (error) {
          console.warn("Auto reply sync failed for phone:", phone, error);
        }
      }

      await saveIntegration(
        {
          auto_replied_message_keys: repliedKeys.slice(-200),
          auto_reply_last_sync_at: new Date().toISOString(),
        },
        integration?.enabled ?? true
      );

      return {
        enabled: true,
        processed,
        replied,
        target_phone: botConfig.auto_reply_phone || null,
      };
    };

    if (action === "get_connection_status") {
      const refreshQr = Boolean(body?.refresh_qr);
      const instanceName = await ensureInstanceName();
      const integration = await getIntegration();
      const cachedQrCodeRaw = integration?.credentials?.qr_code;
      const cachedQrCode =
        typeof cachedQrCodeRaw === "string" && cachedQrCodeRaw.trim().length > 0
          ? String(cachedQrCodeRaw)
          : null;

      let state = "disconnected";
      let qrCode: string | null = cachedQrCode;

      try {
        state = await getConnectionState(instanceName);
      } catch {
        await ensureInstanceCreated(instanceName);
        state = await getConnectionState(instanceName);
      }

      if (state === "connected") {
        qrCode = null;
      } else {
        const shouldFetchFreshQr = refreshQr || !cachedQrCode || state === "qrcode";
        if (shouldFetchFreshQr) {
          try {
            qrCode = (await getQrCode(instanceName)) || cachedQrCode;
          } catch (error) {
            console.warn("Failed to fetch QR code:", error);
            qrCode = cachedQrCode;
          }
        }
      }

      const botConfig = await getBotConfig();

      const previousState = String(integration?.credentials?.last_state || "");
      const previousQrRaw = integration?.credentials?.qr_code;
      const previousQr = typeof previousQrRaw === "string" && previousQrRaw.trim().length > 0 ? String(previousQrRaw) : null;
      const shouldPersistConnection =
        previousState !== state ||
        previousQr !== (qrCode || null) ||
        String(integration?.credentials?.instance_name || "") !== instanceName ||
        !integration?.enabled;

      if (shouldPersistConnection) {
        await saveIntegration(
          {
            instance_name: instanceName,
            last_state: state,
            qr_updated_at: new Date().toISOString(),
            qr_code: qrCode,
          },
          true
        );
      }

      const diagnostic = !qrCode && state !== "connected"
        ? "QR Code nao retornado pelo provedor. Verifique configuracao da Evolution API e o status da instancia."
        : null;

      return new Response(
        JSON.stringify({
          success: true,
          connected: state === "connected",
          connection_state: state,
          instance_name: instanceName,
          qr_code: qrCode,
          diagnostic,
          bot_config: botConfig,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_bot_config") {
      const botConfig = await getBotConfig();
      return new Response(JSON.stringify({ success: true, bot_config: botConfig }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_bot_config") {
      const botConfig = await setBotConfig(body);
      return new Response(JSON.stringify({ success: true, bot_config: botConfig }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect_session") {
      const instanceName = await ensureInstanceName();

      try {
        await evolutionTry([
          { method: "DELETE", path: `/instance/logout/${instanceName}` },
          { method: "POST", path: `/instance/logout/${instanceName}` },
          { method: "DELETE", path: `/instance/delete/${instanceName}` },
          { method: "DELETE", path: `/instance/${instanceName}` },
        ]);
      } catch (error) {
        console.warn("Error while disconnecting WhatsApp session:", error);
      }

      await saveIntegration(
        {
          instance_name: instanceName,
          last_state: "disconnected",
          qr_updated_at: new Date().toISOString(),
        },
        false
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceName = await ensureInstanceName();
    let currentState = "disconnected";
    try {
      currentState = await getConnectionState(instanceName);
    } catch {
      await ensureInstanceCreated(instanceName);
      currentState = await getConnectionState(instanceName);
    }

    if (action === "sync_auto_reply") {
      if (currentState !== "connected") {
        return new Response(
          JSON.stringify({ error: "WhatsApp desconectado. Escaneie o QR Code para conectar." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await syncAutoReply(instanceName);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (currentState !== "connected") {
      return new Response(
        JSON.stringify({ error: "WhatsApp desconectado. Escaneie o QR Code para conectar." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send_message") {
      const to = normalizePhone(String(body?.to || ""));
      const message = String(body?.message || "").trim();

      if (!to || !message) {
        return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jid = `${to}@s.whatsapp.net`;
      const providerResponse = await evolutionTry([
        {
          method: "POST",
          path: `/message/sendText/${instanceName}`,
          body: { number: to, text: message },
        },
        {
          method: "POST",
          path: `/message/sendText/${instanceName}`,
          body: { jid, text: message },
        },
        {
          method: "POST",
          path: `/message/sendText/${instanceName}`,
          body: { to, message },
        },
      ]);

      const waMessageId =
        providerResponse?.key?.id ||
        providerResponse?.data?.key?.id ||
        providerResponse?.message?.id ||
        providerResponse?.id ||
        null;

      await supabase.from("whatsapp_messages").insert({
        user_id: userId,
        contact_phone: to,
        contact_name: body?.contact_name ? String(body.contact_name) : null,
        direction: "outgoing",
        message_text: message,
        wa_message_id: waMessageId,
        status: "sent",
      });

      const integration = await getIntegration();
      const deletedConversations = getDeletedConversations(integration);
      if (deletedConversations[to]) {
        delete deletedConversations[to];
        await saveIntegration(
          {
            deleted_conversations: pruneConversationMap(deletedConversations, 400),
          },
          integration?.enabled ?? true
        );
      }

      return new Response(
        JSON.stringify({ success: true, wa_message_id: waMessageId, provider_response: providerResponse }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list_conversations") {
      const integration = await getIntegration();
      const deletedConversations = getDeletedConversations(integration);
      let providerConversations: any[] = [];

      try {
        const providerResponse = await evolutionTry([
          { method: "POST", path: `/chat/findChats/${instanceName}`, body: { page: 1, limit: 200 } },
          { method: "GET", path: `/chat/findChats/${instanceName}` },
          { method: "GET", path: `/chat/findChats/${instanceName}?page=1&limit=100` },
          { method: "GET", path: `/chat/list/${instanceName}` },
        ]);

        providerConversations = extractArray(providerResponse)
          .map(normalizeConversation)
          .filter(Boolean)
          .filter((conv) => ensureRecentOrNotDeletedConversation(conv.contact_phone, conv.last_date, deletedConversations));
      } catch (error) {
        console.warn("Failed to load conversations from provider:", error);
      }

      const { data: dbMessages } = await supabase
        .from("whatsapp_messages")
        .select("contact_phone, contact_name, message_text, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      const map = new Map<string, any>();

      for (const conv of providerConversations) {
        map.set(conv.contact_phone, conv);
      }

      for (const msg of dbMessages || []) {
        if (!ensureRecentOrNotDeletedConversation(msg.contact_phone, msg.created_at, deletedConversations)) {
          continue;
        }

        if (!map.has(msg.contact_phone)) {
          map.set(msg.contact_phone, {
            contact_phone: msg.contact_phone,
            contact_name: msg.contact_name || msg.contact_phone,
            last_message: msg.message_text || "",
            last_date: msg.created_at,
            unread: 0,
          });
          continue;
        }

        const existing = map.get(msg.contact_phone);
        const existingTime = new Date(existing?.last_date || 0).getTime();
        const messageTime = new Date(msg.created_at || 0).getTime();

        if (!Number.isNaN(messageTime) && messageTime > existingTime) {
          map.set(msg.contact_phone, {
            ...existing,
            contact_name: existing?.contact_name || msg.contact_name || msg.contact_phone,
            last_message: msg.message_text || existing?.last_message || "",
            last_date: msg.created_at,
          });
        }
      }

      const conversations = Array.from(map.values()).sort(
        (a, b) => new Date(b.last_date).getTime() - new Date(a.last_date).getTime()
      );

      return new Response(JSON.stringify({ conversations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_conversation") {
      const contactPhone = normalizePhone(String(body?.contact_phone || ""));
      if (!contactPhone) {
        return new Response(JSON.stringify({ error: "Missing contact_phone" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("whatsapp_messages")
        .delete()
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone);

      const integration = await getIntegration();
      const deletedConversations = getDeletedConversations(integration);
      const messageOverrides = getMessageOverrides(integration);

      deletedConversations[contactPhone] = new Date().toISOString();

      for (const [key, value] of Object.entries(messageOverrides)) {
        if (normalizePhone(String(value?.contact_phone || "")) === contactPhone) {
          delete messageOverrides[key];
        }
      }

      await saveIntegration(
        {
          deleted_conversations: pruneConversationMap(deletedConversations, 400),
          message_overrides: trimMapByUpdatedAt(messageOverrides, 2000),
        },
        integration?.enabled ?? true
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_message") {
      const contactPhone = normalizePhone(String(body?.contact_phone || ""));
      const incomingId = normalizeMessageKey(String(body?.message_id || body?.message_key || ""));
      if (!contactPhone || !incomingId) {
        return new Response(JSON.stringify({ error: "Missing contact_phone or message_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rawId = incomingId.replace(/^wa:/, "").replace(/^id:/, "");

      await supabase
        .from("whatsapp_messages")
        .delete()
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("id", rawId);

      await supabase
        .from("whatsapp_messages")
        .delete()
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("wa_message_id", rawId);

      const integration = await getIntegration();
      const messageOverrides = getMessageOverrides(integration);
      const candidateKeys = [incomingId];
      if (!incomingId.includes(":")) {
        candidateKeys.push(`wa:${incomingId}`, `id:${incomingId}`);
      } else {
        candidateKeys.push(`wa:${rawId}`, `id:${rawId}`);
      }

      const selectedKey = candidateKeys.find((key) => messageOverrides[key]) || candidateKeys[0];
      messageOverrides[selectedKey] = {
        ...(messageOverrides[selectedKey] || {}),
        deleted: true,
        edited_text: undefined,
        contact_phone: contactPhone,
        updated_at: new Date().toISOString(),
      };

      await saveIntegration(
        {
          message_overrides: trimMapByUpdatedAt(messageOverrides, 2000),
        },
        integration?.enabled ?? true
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "edit_message") {
      const contactPhone = normalizePhone(String(body?.contact_phone || ""));
      const incomingId = normalizeMessageKey(String(body?.message_id || body?.message_key || ""));
      const nextText = cleanReplyText(body?.message_text || "");

      if (!contactPhone || !incomingId || !nextText) {
        return new Response(JSON.stringify({ error: "Missing contact_phone, message_id or message_text" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rawId = incomingId.replace(/^wa:/, "").replace(/^id:/, "");

      await supabase
        .from("whatsapp_messages")
        .update({ message_text: nextText, status: "edited" })
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("id", rawId);

      await supabase
        .from("whatsapp_messages")
        .update({ message_text: nextText, status: "edited" })
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("wa_message_id", rawId);

      const integration = await getIntegration();
      const messageOverrides = getMessageOverrides(integration);
      const candidateKeys = [incomingId];
      if (!incomingId.includes(":")) {
        candidateKeys.push(`wa:${incomingId}`, `id:${incomingId}`);
      } else {
        candidateKeys.push(`wa:${rawId}`, `id:${rawId}`);
      }

      const selectedKey = candidateKeys.find((key) => messageOverrides[key]) || candidateKeys[0];
      messageOverrides[selectedKey] = {
        ...(messageOverrides[selectedKey] || {}),
        deleted: false,
        edited_text: nextText,
        contact_phone: contactPhone,
        updated_at: new Date().toISOString(),
      };

      await saveIntegration(
        {
          message_overrides: trimMapByUpdatedAt(messageOverrides, 2000),
        },
        integration?.enabled ?? true
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_messages") {
      const contactPhone = normalizePhone(String(body?.contact_phone || ""));
      if (!contactPhone) {
        return new Response(JSON.stringify({ error: "Missing contact_phone" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const integration = await getIntegration();
      const deletedConversations = getDeletedConversations(integration);
      const messageOverrides = getMessageOverrides(integration);
      const deletedSince = deletedConversations[contactPhone] || null;
      const deletedSinceTime = deletedSince ? new Date(deletedSince).getTime() : 0;

      const isAfterDeletion = (dateValue: string) => {
        if (!deletedSinceTime) return true;
        const ts = new Date(dateValue || 0).getTime();
        if (!Number.isFinite(ts)) return false;
        return ts > deletedSinceTime;
      };

      const jid = `${contactPhone}@s.whatsapp.net`;
      let providerMessages: any[] = [];

      try {
        const providerResponse = await evolutionTry([
          {
            method: "POST",
            path: `/chat/findMessages/${instanceName}`,
            body: { remoteJid: jid, limit: 120 },
          },
          { method: "GET", path: `/chat/findMessages/${instanceName}/${jid}` },
          { method: "GET", path: `/chat/messages/${instanceName}/${jid}` },
        ]);

        providerMessages = extractArray(providerResponse)
          .map((msg, index) => normalizeProviderMessage(msg, contactPhone, index))
          .filter((msg) => msg.message_text.trim().length > 0)
          .filter((msg) => isAfterDeletion(msg.created_at));
      } catch (error) {
        console.warn("Failed to load messages from provider:", error);
      }

      if (providerMessages.length === 0) {
        try {
          const chatsResponse = await evolutionTry([
            { method: "POST", path: `/chat/findChats/${instanceName}`, body: { page: 1, limit: 200 } },
            { method: "GET", path: `/chat/findChats/${instanceName}` },
            { method: "GET", path: `/chat/findChats/${instanceName}?page=1&limit=100` },
          ]);

          const chatItems = extractArray(chatsResponse);
          const matchedChat = chatItems.find((chat) => {
            const candidates = [
              chat?.remoteJidAlt,
              chat?.remoteJid,
              chat?.jid,
              chat?.id,
              chat?.phone,
              chat?.lastMessage?.key?.remoteJidAlt,
              chat?.lastMessage?.key?.remoteJid,
              chat?.lastMessage?.key?.participantAlt,
            ];

            return candidates.some((value) => normalizePhone(String(value || "")) === contactPhone);
          });

          const lastMessage = matchedChat?.lastMessage || null;
          if (lastMessage) {
            const normalized = normalizeProviderMessage(lastMessage, contactPhone, 0);
            if (normalized.message_text.trim().length > 0 && isAfterDeletion(normalized.created_at)) {
              providerMessages = [normalized];
            }
          }
        } catch (fallbackError) {
          console.warn("Fallback chat lookup failed:", fallbackError);
        }
      }

      const { data: dbMessages } = await supabase
        .from("whatsapp_messages")
        .select("id, wa_message_id, contact_phone, contact_name, direction, message_text, created_at, status")
        .eq("contact_phone", contactPhone)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(500);

      const merged = new Map<string, any>();
      const contentIndex = new Map<string, string>();

      const makeContentKey = (msg: any) => {
        const text = cleanReplyText(msg?.message_text || "");
        const createdAt = toIsoDate(msg?.created_at);
        return `${msg?.direction || "unknown"}|${text}|${createdAt}`;
      };

      const upsertMessage = (rawMsg: any) => {
        const msg = {
          ...rawMsg,
          contact_phone: contactPhone,
          created_at: toIsoDate(rawMsg?.created_at),
          message_text: String(rawMsg?.message_text || ""),
          wa_message_id: rawMsg?.wa_message_id ? String(rawMsg.wa_message_id) : null,
        };

        if (!msg.message_text.trim()) return;
        if (!isAfterDeletion(msg.created_at)) return;

        const primaryKey = buildMessageKey(msg);
        const contentKey = makeContentKey(msg);

        if (merged.has(primaryKey)) {
          const existing = merged.get(primaryKey);
          merged.set(primaryKey, { ...existing, ...msg, message_key: primaryKey });
          contentIndex.set(contentKey, primaryKey);
          return;
        }

        const existingByContentKey = contentIndex.get(contentKey);
        if (existingByContentKey && merged.has(existingByContentKey)) {
          const existing = merged.get(existingByContentKey);
          const prefersCurrent = !!msg.wa_message_id && !existing?.wa_message_id;

          if (prefersCurrent) {
            merged.delete(existingByContentKey);
            merged.set(primaryKey, { ...existing, ...msg, message_key: primaryKey });
            contentIndex.set(contentKey, primaryKey);
          } else {
            merged.set(existingByContentKey, {
              ...msg,
              ...existing,
              message_key: existingByContentKey,
              wa_message_id: existing?.wa_message_id || msg.wa_message_id,
            });
          }
          return;
        }

        merged.set(primaryKey, { ...msg, message_key: primaryKey });
        contentIndex.set(contentKey, primaryKey);
      };

      for (const msg of providerMessages) upsertMessage(msg);
      for (const msg of dbMessages || []) upsertMessage(msg);

      const messages = Array.from(merged.entries())
        .map(([key, msg]) => {
          const override = messageOverrides[key] || null;
          if (override?.deleted) return null;

          const editedText = cleanReplyText(override?.edited_text || "");
          const isEdited = Boolean(editedText);

          return {
            ...msg,
            message_key: key,
            message_text: isEdited ? editedText : String(msg.message_text || ""),
            edited: isEdited || Boolean(msg.edited),
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return new Response(JSON.stringify({ messages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("WhatsApp function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});











