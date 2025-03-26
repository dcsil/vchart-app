"use client";

import { useState, useEffect, useRef } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TranscriptionApp() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimResult, setInterimResult] = useState("");
  const [error, setError] = useState("");
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);

  const startListening = async () => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
        process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
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

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`w-16 h-16 rounded-full ${
              isListening
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
          <p className="text-sm text-gray-400">
            {isListening ? "Tap to stop" : "Tap to start"}
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800 border-gray-700">
        <ScrollArea className="h-[400px] w-full rounded-md border border-gray-700 p-4">
          {transcript || interimResult ? (
            <p className="text-gray-200 whitespace-pre-wrap">
              {transcript}
              {interimResult && (
                <span className="text-gray-400">
                  {transcript ? " " : ""}
                  {interimResult}
                </span>
              )}
            </p>
          ) : (
            <p className="text-gray-400 text-center">
              {isListening ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Listening...
                </span>
              ) : (
                "Transcript will appear here"
              )}
            </p>
          )}
        </ScrollArea>
      </Card>

      {error && (
        <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
