/**
 * useVoiceInput
 *
 * Primary:  Web Speech API (SpeechRecognition) — Chrome / Edge / Safari.
 *           Works without any server. lang defaults to pt-BR.
 *
 * Fallback: MediaRecorder → base64 → Supabase gemini-stt edge function.
 *           Used only when SpeechRecognition is unavailable.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const hasSpeechAPI =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export interface UseVoiceInputOptions {
  /** BCP-47 language tag, e.g. "pt-BR" */
  lang?: string;
  /** Called with final transcript text */
  onTranscript: (text: string) => void;
  /** Called on any error */
  onError?: (message: string) => void;
}

export const useVoiceInput = ({
  lang = "pt-BR",
  onTranscript,
  onError,
}: UseVoiceInputOptions) => {
  const [isListening, setIsListening]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const srRef       = useRef<SpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  // Stable callback refs so startListening/stopListening don't change identity
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef      = useRef(onError);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onErrorRef.current = onError; },          [onError]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  /* ── Fallback: MediaRecorder + gemini-stt ──────────────────────────── */
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res((r.result as string).split(",")[1]);
      r.onerror   = rej;
      r.readAsDataURL(blob);
    });

  const transcribeBlob = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke("gemini-stt", {
        body: { audio: base64, mimeType: blob.type, lang },
      });
      if (error) throw error;
      const text: string = data?.text || "";
      if (text) {
        setLiveTranscript(text);
        onTranscriptRef.current(text);
      } else {
        onErrorRef.current?.("Nenhum texto reconhecido");
      }
    } catch (e) {
      console.error("[useVoiceInput] gemini-stt error:", e);
      onErrorRef.current?.("Falha ao transcrever áudio");
    } finally {
      setIsTranscribing(false);
    }
  }, [lang]);

  /* ── Start ─────────────────────────────────────────────────────────── */
  const startListening = useCallback(async () => {
    setLiveTranscript("");

    if (hasSpeechAPI) {
      /* ── Path A: Web Speech API ──────────────────────────────────── */
      const SR =
        (window as unknown as { SpeechRecognition: typeof SpeechRecognition }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;

      const sr: SpeechRecognition = new SR();
      sr.lang             = lang;
      sr.continuous       = false;
      sr.interimResults   = true;
      sr.maxAlternatives  = 1;
      srRef.current       = sr;

      let finalText = "";

      sr.onresult = (e: SpeechRecognitionEvent) => {
        let interim = "";
        let final   = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final   += t;
          else                      interim += t;
        }
        const display = final || interim;
        setLiveTranscript(display);
        if (final) finalText = final;
      };

      sr.onend = () => {
        setIsListening(false);
        srRef.current = null;
        if (finalText) {
          setLiveTranscript(finalText);
          onTranscriptRef.current(finalText);
        }
      };

      sr.onerror = (e: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        srRef.current = null;
        if (e.error !== "aborted" && e.error !== "no-speech") {
          onErrorRef.current?.("Erro no reconhecimento de voz");
        }
      };

      try {
        sr.start();
        setIsListening(true);
      } catch (err) {
        console.error("[useVoiceInput] SpeechRecognition.start error:", err);
        onErrorRef.current?.("Não foi possível iniciar o reconhecimento de voz");
      }
    } else {
      /* ── Path B: MediaRecorder + gemini-stt ──────────────────────── */
      if (typeof MediaRecorder === "undefined") {
        onErrorRef.current?.("Gravação de áudio não suportada neste navegador");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mimeType =
          ["audio/webm", "audio/mp4", "audio/aac", "audio/mpeg"].find(
            t => MediaRecorder.isTypeSupported(t)
          ) ?? "";

        const rec = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorderRef.current = rec;
        chunksRef.current   = [];

        rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        rec.onstop = () => {
          releaseStream();
          const blob = new Blob(chunksRef.current, {
            type: rec.mimeType || mimeType || "audio/mp4",
          });
          transcribeBlob(blob);
        };

        rec.start(250);
        setIsListening(true);
      } catch (e) {
        releaseStream();
        const msg =
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Permissão de microfone negada. Verifique as configurações do navegador."
            : "Não foi possível acessar o microfone";
        onErrorRef.current?.(msg);
      }
    }
  }, [lang, releaseStream, transcribeBlob]);

  /* ── Stop ──────────────────────────────────────────────────────────── */
  const stopListening = useCallback(() => {
    if (hasSpeechAPI && srRef.current) {
      srRef.current.stop(); // triggers onend → transcript
      return;
    }
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop(); // triggers onstop → transcribeBlob
    } else {
      releaseStream();
    }
    setIsListening(false);
  }, [releaseStream]);

  /* ── Cleanup on unmount ────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      srRef.current?.abort();
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      releaseStream();
    };
  }, [releaseStream]);

  return {
    isListening,
    isTranscribing,
    liveTranscript,
    startListening,
    stopListening,
  };
};
