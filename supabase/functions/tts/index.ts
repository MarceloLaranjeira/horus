import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "Content-Type, Content-Length",
};


const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const pcm16ToWav = (pcmData: Uint8Array, sampleRate: number): Uint8Array => {
  const evenLength = pcmData.length - (pcmData.length % 2);
  const pcmBytes = pcmData.subarray(0, evenLength);

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  const dataLength = pcmBytes.length;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  const wav = new Uint8Array(44 + dataLength);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcmBytes, 44);
  return wav;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, provider } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Texto vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanText = text.substring(0, 4000);

    if (provider === "openai") {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "OPENAI_API_KEY não configurada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: cleanText,
          voice: voiceId || "alloy",
          response_format: "mp3",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI TTS error:", response.status, errText);
        return new Response(
          JSON.stringify({ error: `Erro OpenAI TTS: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const audioBuffer = await response.arrayBuffer();
      return new Response(audioBuffer, {
        headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
      });

    } else if (provider === "gemini") {
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "GEMINI_API_KEY não configurada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use Gemini's TTS via the generateContent endpoint with audio output
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{
                  text: `Converta exatamente o texto abaixo em áudio falado. Não adicione, não remova e não reescreva nada. Retorne somente áudio.\n\nTexto:\n${cleanText}`,
                }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceId || "Kore",
                  },
                },
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini TTS error:", response.status, errText);
        return new Response(
          JSON.stringify({ error: `Erro Gemini TTS: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      
      // Extract audio data from Gemini response
      const audioPart = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!audioPart || !audioPart.data) {
        console.error("Gemini TTS: no audio in response", JSON.stringify(data).substring(0, 500));
        return new Response(
          JSON.stringify({ error: "Gemini não retornou áudio" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mimeType = String(audioPart.mimeType || "");
      const rateMatch = mimeType.match(/rate=(\d+)/i);
      const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

      console.log("[Gemini TTS] mimeType:", mimeType, "sampleRate:", sampleRate, "dataLen:", audioPart.data.length);

      const pcmBytes = base64ToUint8Array(audioPart.data);
      const wavBytes = pcm16ToWav(pcmBytes, sampleRate);

      return new Response(wavBytes, {
        headers: { ...corsHeaders, "Content-Type": "audio/wav" },
      });

    } else {
      return new Response(
        JSON.stringify({ error: `Provedor desconhecido: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("TTS error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
