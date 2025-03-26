"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTranscription } from "@/hooks/useTranscription";

export function TranscriptionUI() {
  const {
    isListening,
    transcript,
    interimResult,
    error,
    startListening,
    stopListening,
  } = useTranscription();

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
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
          </button>
          <p className="text-sm text-gray-400">
            {isListening ? "Tap to stop" : "Tap to start"}
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="h-[400px] w-full rounded-md border border-gray-700 p-4 overflow-auto">
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
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
