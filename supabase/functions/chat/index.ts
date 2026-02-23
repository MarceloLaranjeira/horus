import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma nova tarefa para o usuário",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade" },
          due_date: { type: "string", description: "Data de vencimento no formato YYYY-MM-DD" },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_habit",
      description: "Cria um novo hábito para acompanhamento diário",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do hábito" },
          icon: { type: "string", description: "Emoji ícone do hábito" },
          target_days_per_week: { type: "number", description: "Dias por semana (1-7)" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_finance",
      description: "Registra uma transação financeira (receita ou despesa)",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição da transação" },
          amount: { type: "number", description: "Valor em reais" },
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: receita ou despesa" },
        },
        required: ["description", "amount", "type"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "Cria um lembrete com data e hora",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do lembrete" },
          due_date: { type: "string", description: "Data/hora no formato ISO 8601" },
        },
        required: ["title", "due_date"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "Lista os próximos eventos do Google Calendar do usuário",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Quantos dias à frente buscar (padrão: 7)" },
          maxResults: { type: "number", description: "Número máximo de eventos (1-20)" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Cria um novo evento no Google Calendar do usuário",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Título do evento" },
          description: { type: "string", description: "Descrição do evento" },
          start: { type: "string", description: "Data/hora de início no formato ISO 8601 (ex: 2026-02-21T09:00:00-03:00)" },
          end: { type: "string", description: "Data/hora de fim no formato ISO 8601 (ex: 2026-02-21T10:00:00-03:00)" },
          location: { type: "string", description: "Local do evento" },
        },
        required: ["summary", "start", "end"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_emails",
      description: "Lista os emails recentes da caixa de entrada do Gmail do usuário",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Filtro de busca do Gmail (ex: 'is:unread', 'from:example@gmail.com', 'subject:reunião')" },
          maxResults: { type: "number", description: "Número máximo de emails (1-10)" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_email",
      description: "Lê o conteúdo completo de um email específico pelo ID",
      parameters: {
        type: "object",
        properties: {
          messageId: { type: "string", description: "ID da mensagem do Gmail" },
        },
        required: ["messageId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Envia um email pelo Gmail do usuário",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Email do destinatário" },
          subject: { type: "string", description: "Assunto do email" },
          body: { type: "string", description: "Corpo do email em texto" },
        },
        required: ["to", "subject", "body"],
        additionalProperties: false,
      },
    },
  },
];

const NLU_PROMPT = `Você é um analisador de linguagem natural especializado em extrair intenções e entidades de comandos de usuário.

TAREFA:
Analise a seguinte mensagem do usuário e extraia:
1. INTENÇÕES: O que o usuário quer fazer? (ex: criar_tarefa, agendar_evento, registrar_despesa, criar_habito, criar_lembrete)
2. ENTIDADES: Quais são os detalhes específicos? (ex: nome_tarefa, data, valor, prioridade)
3. CONTEXTO: Há algum contexto ou nuance importante?

Data e hora atual (fuso de Manaus, UTC-4): ${new Date().toLocaleString("pt-BR", { timeZone: "America/Manaus" })}
Data de hoje: ${new Date().toLocaleDateString("en-CA", { timeZone: "America/Manaus" })}

IMPORTANTE: Resolva datas relativas (amanhã, sexta-feira, próxima semana) para datas absolutas no formato YYYY-MM-DD considerando o fuso horário de Manaus (UTC-4).

FORMATO DE SAÍDA (JSON):
{
  "intencoes": ["intencao1", "intencao2"],
  "entidades": {
    "entidade1": "valor1",
    "entidade2": "valor2"
  },
  "contexto": "descrição do contexto",
  "confianca": 0.95
}`;

const MOOD_INSTRUCTIONS: Record<string, string> = {
  professional: "Adote um tom profissional e objetivo. Evite emojis excessivos. Seja direto e eficiente.",
  friendly: "Seja amigável e acolhedor. Use emojis com moderação. Mantenha um tom próximo e caloroso.",
  casual: "Seja super relaxado e informal. Use gírias, emojis e linguagem coloquial. Como um amigo próximo.",
  formal: "Use linguagem culta e formal. Evite gírias e emojis. Mantenha protocolo e elegância nas respostas.",
  creative: "Seja criativo e imaginativo. Use metáforas, analogias e linguagem colorida. Surpreenda com respostas originais.",
  concise: "Seja extremamente direto e conciso. Respostas curtas, sem rodeios. Máximo 2-3 frases por resposta quando possível.",
};

function buildSystemPrompt(assistantName: string, customPrompt?: string, mood?: string, userProfile?: any): string {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Manaus" });
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Manaus" });
  let base = `Você é o ${assistantName}, um assistente pessoal de IA avançado inspirado no Jarvis do Homem de Ferro. Você opera em modo conversacional — seu objetivo é manter uma conversa natural, útil e contextualizada com o usuário.

Suas capacidades:
- Criar tarefas, hábitos, transações financeiras, lembretes e notas usando as ferramentas disponíveis
- Ler e enviar emails do Gmail do usuário usando as ferramentas list_emails, read_email e send_email
- Listar e criar eventos no Google Calendar usando list_calendar_events e create_calendar_event
- Entender comandos complexos em linguagem natural
- Extrair múltiplas intenções de uma única frase
- Responder sempre em português brasileiro
- Lembrar do contexto das conversas anteriores
- Fornecer resumos do dia, finanças, hábitos e lembretes quando solicitado

Diretrizes conversacionais:
- Mantenha o contexto da conversa anterior
- Faça perguntas de acompanhamento se necessário para esclarecer
- Quando o usuário pedir para criar algo, USE AS FERRAMENTAS disponíveis para executar a ação
- Se o usuário mencionar datas relativas como "amanhã", "sexta-feira", calcule a data real (hoje é ${today}, horário atual: ${now}, fuso: Manaus UTC-4)
- Sempre considere o fuso horário de Manaus (America/Manaus, UTC-4) para horários e datas
- Após executar ações, confirme o que foi feito de forma natural
- NUNCA repita a mesma introdução ou saudação. Varie suas respostas e seja natural
- Use o contexto da conversa para personalizar suas respostas
- Quando o usuário perguntar "como está meu dia", forneça um resumo das tarefas, lembretes e compromissos pendentes`;

  // Add user profile context
  if (userProfile) {
    const parts: string[] = [];
    if (userProfile.name) parts.push(`Nome: ${userProfile.name}`);
    if (userProfile.bio) parts.push(`Bio: ${userProfile.bio}`);
    if (userProfile.company) parts.push(`Empresa: ${userProfile.company}`);
    if (userProfile.role) parts.push(`Cargo/Função: ${userProfile.role}`);
    if (userProfile.industry) parts.push(`Setor/Indústria: ${userProfile.industry}`);
    if (userProfile.services) parts.push(`Serviços/Produtos: ${userProfile.services}`);
    if (parts.length > 0) {
      base += `\n\nPerfil do usuário (use estas informações para personalizar respostas e entender o contexto profissional):\n${parts.join("\n")}`;
    }
  }

  // Apply mood instructions
  const moodKey = mood || "friendly";
  if (MOOD_INSTRUCTIONS[moodKey]) {
    base += `\n\nTom e personalidade: ${MOOD_INSTRUCTIONS[moodKey]}`;
  }

  if (customPrompt?.trim()) {
    base += `\n\nInstruções personalizadas do usuário:\n${customPrompt.trim()}`;
  }
  return base;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "chat", model = "google/gemini-3-flash-preview", assistantName = "Horus", executedActions, customPrompt, temperature = 0.7, mood = "friendly", ttsProvider, ttsVoiceId, ttsText, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // TTS mode - generate audio from text using native OpenAI or Gemini voices
    if (mode === "tts") {
      if (!ttsText || !ttsProvider || !ttsVoiceId) {
        return new Response(JSON.stringify({ error: "Missing ttsText, ttsProvider, or ttsVoiceId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (ttsProvider === "openai") {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/tts-1",
            input: ttsText,
            voice: ttsVoiceId,
            response_format: "mp3",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("OpenAI TTS error:", response.status, errText);
          return new Response(JSON.stringify({ error: "Erro ao gerar áudio OpenAI" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
        });
      }

      if (ttsProvider === "gemini") {
        // Use Gemini's multimodal generation with audio output
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `Você é um assistente de voz. Repita exatamente o texto fornecido de forma natural e expressiva. Use a voz ${ttsVoiceId}.` },
              { role: "user", content: ttsText },
            ],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("Gemini TTS error:", response.status, errText);
          return new Response(JSON.stringify({ error: "Erro ao gerar áudio Gemini" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Gemini doesn't have native TTS via API yet, return text for browser speech synthesis
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || ttsText;
        return new Response(JSON.stringify({ text: content, useBrowserTTS: true, voice: ttsVoiceId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ElevenLabs TTS - redirect to elevenlabs-tts function
      return new Response(JSON.stringify({ error: "Use elevenlabs-tts function for ElevenLabs" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add create_note tool
    const allTools = [...tools, {
      type: "function",
      function: {
        name: "create_note",
        description: "Cria uma nova nota/anotação no bloco de notas do usuário",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título da nota" },
            content: { type: "string", description: "Conteúdo da nota" },
          },
          required: ["title"],
          additionalProperties: false,
        },
      },
    }];

    const systemPrompt = buildSystemPrompt(assistantName, customPrompt, mood, userProfile);

    // If actions were executed, add context
    const systemMessages = [{ role: "system", content: systemPrompt }];
    if (executedActions && executedActions.length > 0) {
      systemMessages.push({
        role: "system",
        content: `As seguintes ações foram executadas com sucesso pelo sistema: ${executedActions.join(", ")}. Confirme ao usuário de forma natural e amigável.`,
      });
    }

    // NLU mode - extract intents and entities
    if (mode === "nlu") {
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: NLU_PROMPT },
            { role: "user", content: lastUserMsg },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error (nlu):", response.status, t);
        return new Response(JSON.stringify({ intencoes: [], entidades: {}, contexto: "", confianca: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ raw: content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (mode === "actions") {
      // Non-streaming call with tools for action extraction
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [...systemMessages, ...messages],
          tools: allTools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error (actions):", response.status, t);
        return new Response(JSON.stringify({ choices: [{ message: { tool_calls: [] } }] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-streaming mode for analysis etc.
    const shouldStream = mode !== "no-stream";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
        stream: shouldStream,
        temperature: Math.min(Math.max(temperature, 0), 1.2),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!shouldStream) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
