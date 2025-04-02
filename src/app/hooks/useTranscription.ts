"use client";

import { useState, useRef, useEffect } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export function useTranscription() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimResult, setInterimResult] = useState("");
  const [error, setError] = useState("");
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);

  const startListening = async () => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY!,
        process.env.AZURE_SPEECH_REGION!
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          setTranscript((prev) => prev + (prev ? " " : "") + e.result.text);
          setInterimResult("");
        }
      };

      recognizer.recognizing = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
          setInterimResult(e.result.text);
        }
      };

      recognizer.canceled = (s, e) => {
        if (e.reason === sdk.CancellationReason.Error) {
          setError(`Error: ${e.errorDetails}`);
        }
        setIsListening(false);
        setInterimResult("");
      };

      recognizerRef.current = recognizer;
      await recognizer.startContinuousRecognitionAsync();
      setIsListening(true);
      setError("");
    } catch (err) {
      setError(
        "Failed to start transcription. Please check your Azure credentials."
      );
      console.error(err);
    }
  };

  const stopListening = async () => {
    if (recognizerRef.current) {
      try {
        await recognizerRef.current.stopContinuousRecognitionAsync();
        recognizerRef.current = null;
        setIsListening(false);
        setInterimResult("");
      } catch (err) {
        console.error("Error stopping transcription:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimResult,
    error,
    startListening,
    stopListening,
  };
}
