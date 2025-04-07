import { renderHook, act } from "@testing-library/react";
import { useTranscription } from "../useTranscription";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Create a mock for the Speech SDK
jest.mock("microsoft-cognitiveservices-speech-sdk", () => {
  return {
    SpeechConfig: {
      fromSubscription: jest.fn(() => ({})),
    },
    AudioConfig: {
      fromDefaultMicrophoneInput: jest.fn(() => ({})),
    },
    SpeechRecognizer: jest.fn().mockImplementation(() => {
      return {
        // We mock these async methods so they resolve immediately
        startContinuousRecognitionAsync: jest.fn().mockResolvedValue(undefined),
        stopContinuousRecognitionAsync: jest.fn().mockResolvedValue(undefined),
        // These callbacks will be set by the hook
        recognized: null,
        recognizing: null,
        canceled: null,
      };
    }),
    ResultReason: {
      RecognizedSpeech: "RecognizedSpeech",
      RecognizingSpeech: "RecognizingSpeech",
    },
    CancellationReason: {
      Error: "Error",
    },
  };
});

describe("useTranscription", () => {
  // Set dummy environment variables required by the hook
  const dummyKey = "dummy-key";
  const dummyRegion = "dummy-region";

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY = dummyKey;
    process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION = dummyRegion;
    jest.clearAllMocks();
  });

  test("should start listening and update state", async () => {
    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.startListening();
    });

    // isListening should be true, and no error should be present
    expect(result.current.isListening).toBe(true);
    expect(result.current.error).toBe("");
    // Verify that a SpeechRecognizer instance was created
    expect(sdk.SpeechRecognizer).toHaveBeenCalledTimes(1);
  });

  test("should update transcript when recognized callback is fired", async () => {
    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.startListening();
    });

    // Get the instance of SpeechRecognizer created by the hook
    const recognizerInstance = sdk.SpeechRecognizer.mock.results[0].value;

    // Simulate the recognized callback firing with a recognized speech event
    act(() => {
      recognizerInstance.recognized(null, {
        result: {
          reason: sdk.ResultReason.RecognizedSpeech,
          text: "Hello",
        },
      });
    });

    expect(result.current.transcript).toBe("Hello");
    // interimResult should be cleared after a full recognition
    expect(result.current.interimResult).toBe("");
  });

  test("should update interimResult when recognizing callback is fired", async () => {
    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.startListening();
    });

    const recognizerInstance = sdk.SpeechRecognizer.mock.results[0].value;

    // Simulate the recognizing callback firing with an interim result
    act(() => {
      recognizerInstance.recognizing(null, {
        result: {
          reason: sdk.ResultReason.RecognizingSpeech,
          text: "Hel",
        },
      });
    });

    expect(result.current.interimResult).toBe("Hel");
  });

  test("should update error and stop listening when canceled callback with error is fired", async () => {
    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.startListening();
    });

    const recognizerInstance = sdk.SpeechRecognizer.mock.results[0].value;

    // Simulate a cancel event with an error
    act(() => {
      recognizerInstance.canceled(null, {
        reason: sdk.CancellationReason.Error,
        errorDetails: "Test error",
      });
    });

    expect(result.current.error).toBe("Error: Test error");
    expect(result.current.isListening).toBe(false);
    expect(result.current.interimResult).toBe("");
  });

  test("should stop listening when stopListening is called", async () => {
    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.startListening();
    });

    const recognizerInstance = sdk.SpeechRecognizer.mock.results[0].value;

    await act(async () => {
      await result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
    // Verify that stopContinuousRecognitionAsync was called
    expect(
      recognizerInstance.stopContinuousRecognitionAsync
    ).toHaveBeenCalled();
  });

  test("should cleanup on unmount by stopping recognition", async () => {
    const { result, unmount } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.startListening();
    });

    const recognizerInstance = sdk.SpeechRecognizer.mock.results[0].value;

    // Unmounting the hook should trigger the cleanup effect
    unmount();
    expect(
      recognizerInstance.stopContinuousRecognitionAsync
    ).toHaveBeenCalled();
  });
});
