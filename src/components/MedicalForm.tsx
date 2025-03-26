"use client";

import { useState, useEffect, useRef } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { CohereClient } from "cohere-ai";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mic, MicOff, Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const formSchema = z.object({
  bloodPressure: z.string().min(1, "Blood pressure is required"),
  heartRate: z.string().min(1, "Heart rate is required"),
  oxygenLevel: z.string().min(1, "Oxygen level is required"),
  temperature: z.string().min(1, "Temperature is required"),
  respiratoryRate: z.string().min(1, "Respiratory rate is required"),
  notes: z.string().optional(),
});

// Initialize Cohere client only if API key is available
const cohere = process.env.NEXT_PUBLIC_COHERE_API_KEY
  ? new CohereClient({
      token: process.env.NEXT_PUBLIC_COHERE_API_KEY,
    })
  : null;

export function MedicalForm() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bloodPressure: "",
      heartRate: "",
      oxygenLevel: "",
      temperature: "",
      respiratoryRate: "",
      notes: "",
    },
  });

  const processTranscript = async (text: string) => {
    if (!cohere) {
      toast.error("Cohere API key not configured");
      return;
    }

    try {
      setProcessing(true);
      const response = await cohere.generate({
        prompt: `Extract medical vital signs from the following text and return ONLY a JSON object with these exact keys: bloodPressure, heartRate, oxygenLevel, temperature, respiratoryRate. Use empty strings for missing values. Example output: {"bloodPressure":"120/80","heartRate":"72","oxygenLevel":"98","temperature":"98.6","respiratoryRate":"16"}

Input text: "${text}"`,
        maxTokens: 100,
        temperature: 0,
        returnLikelihoods: "NONE",
      });

      const result = response.generations[0]?.text;
      if (result) {
        try {
          // Remove any potential non-JSON text before parsing
          const jsonStr = result.substring(
            result.indexOf("{"),
            result.lastIndexOf("}") + 1
          );
          const parsedResult = JSON.parse(jsonStr);

          // Validate the parsed result has the expected structure
          if (typeof parsedResult === "object" && parsedResult !== null) {
            form.setValue("bloodPressure", parsedResult.bloodPressure || "");
            form.setValue("heartRate", parsedResult.heartRate || "");
            form.setValue("oxygenLevel", parsedResult.oxygenLevel || "");
            form.setValue("temperature", parsedResult.temperature || "");
            form.setValue(
              "respiratoryRate",
              parsedResult.respiratoryRate || ""
            );
            toast.success("Form auto-filled from speech");
          } else {
            throw new Error("Invalid response structure");
          }
        } catch (e) {
          console.error("Failed to parse Cohere response:", e);
          toast.error("Failed to parse response");
        }
      }
    } catch (err) {
      console.error("Error processing with Cohere:", err);
      toast.error("Failed to process speech");
    } finally {
      setProcessing(false);
    }
  };

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
          const newTranscript = e.result.text;
          setTranscript((prev) => prev + " " + newTranscript);
          processTranscript(newTranscript);
        }
      };

      recognizerRef.current = recognizer;
      await recognizer.startContinuousRecognitionAsync();
      setIsListening(true);
      toast.success("Started listening");
    } catch (err) {
      console.error(err);
      toast.error("Failed to start listening");
    }
  };

  const stopListening = async () => {
    if (recognizerRef.current) {
      try {
        await recognizerRef.current.stopContinuousRecognitionAsync();
        recognizerRef.current = null;
        setIsListening(false);
        toast.success("Stopped listening");
      } catch (err) {
        console.error("Error stopping transcription:", err);
        toast.error("Failed to stop listening");
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
    toast.success("Form submitted successfully");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Patient Vitals</h2>
          </div>
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? "destructive" : "default"}
            className="relative"
            disabled={processing}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 mr-2" />
            ) : (
              <Mic className="w-4 h-4 mr-2" />
            )}
            {isListening ? "Stop Recording" : "Start Recording"}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Pressure</FormLabel>
                    <FormControl>
                      <Input placeholder="120/80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heart Rate (BPM)</FormLabel>
                    <FormControl>
                      <Input placeholder="72" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oxygenLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oxygen Level (%)</FormLabel>
                    <FormControl>
                      <Input placeholder="98" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°F)</FormLabel>
                    <FormControl>
                      <Input placeholder="98.6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="respiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respiratory Rate</FormLabel>
                    <FormControl>
                      <Input placeholder="16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Any additional observations"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Submit Vitals
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
