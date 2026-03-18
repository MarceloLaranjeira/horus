/**
 * useVoiceInput — Web Speech API (SpeechRecognition)
 *
 * Uses the browser-native SpeechRecognition API.
 * No server, no API key required.
 * Supported: Chrome 25+, Edge 79+, Safari 14.1+
 * Not supported: Firefox (shows friendly error)
 *
 * The API is checked at call-time (not module-load) to avoid
 * issues with SSR and early evaluation.
 */
import { useState, useRef, useCallback, useEffect } from "react";

// TypeScript: browser types for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export interface UseVoiceInputOptions {
  /** BCP-47 language tag, e.g. "pt-BR" */
  lang?: string;
  /** Called with the final transcript text */
  onTranscript: (text: string) => void;
  /** Called on any error — show to user */
  onError?: (message: string) => void;
}

export const useVoiceInput = ({
  lang = "pt-BR",
  onTranscript,
  onError,
}: UseVoiceInputOptions) => {
  const [isListening,    setIsListening]    = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const srRef           = useRef<SpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef      = useRef(onError);

  // Keep refs fresh so callbacks never capture stale values
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onErrorRef.current      = onError;      }, [onError]);

  /** Returns the SpeechRecognition constructor, or null if unsupported */
  const getSR = (): typeof SpeechRecognition | null =>
    window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;

  const startListening = useCallback(() => {
    setLiveTranscript("");

    const SR = getSR();
    if (!SR) {
      onErrorRef.current?.(
        "Reconhecimento de voz não suportado. Use Chrome, Edge ou Safari."
      );
      return;
    }

    // Abort any previous session
    if (srRef.current) {
      try { srRef.current.abort(); } catch {}
      srRef.current = null;
    }

    const sr = new SR();
    sr.lang            = lang;
    sr.continuous      = false;
    sr.interimResults  = true;
    sr.maxAlternatives = 1;
    srRef.current      = sr;

    let finalText = "";

    sr.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalChunk  = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk  += t;
        else                      interimText += t;
      }
      const display = finalChunk || interimText;
      setLiveTranscript(display);
      if (finalChunk) finalText = finalChunk;
    };

    sr.onend = () => {
      setIsListening(false);
      srRef.current = null;
      if (finalText.trim()) {
        setLiveTranscript(finalText);
        onTranscriptRef.current(finalText.trim());
      }
    };

    sr.onerror = (e: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      srRef.current = null;

      // "aborted" = we stopped it; "no-speech" = silence timeout — not errors
      if (e.error === "aborted" || e.error === "no-speech") return;

      const messages: Partial<Record<string, string>> = {
        "not-allowed":    "Permissão de microfone negada. Verifique as configurações do navegador.",
        "audio-capture":  "Microfone não encontrado ou inacessível.",
        "network":        "Erro de rede no reconhecimento de voz. Verifique sua conexão.",
        "service-not-allowed": "Serviço de voz bloqueado. Acesse via HTTPS ou localhost.",
      };
      onErrorRef.current?.(messages[e.error] ?? `Erro de voz: ${e.error}`);
    };

    try {
      sr.start();
      setIsListening(true);
    } catch (err) {
      srRef.current = null;
      console.error("[useVoiceInput] start error:", err);
      onErrorRef.current?.("Não foi possível iniciar o microfone.");
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (srRef.current) {
      try { srRef.current.stop(); } catch {} // triggers onend → transcript
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { srRef.current?.abort(); } catch {}
      srRef.current = null;
    };
  }, []);

  return {
    isListening,
    isTranscribing: false as const, // no async transcription step with Web Speech API
    liveTranscript,
    startListening,
    stopListening,
  };
};
