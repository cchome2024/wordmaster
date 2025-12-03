import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using a cache to prevent redundant API calls during a session
const audioCache = new Map<string, AudioBuffer>();

/**
 * Decodes base64 string to an AudioBuffer.
 */
async function decodeAudioData(
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Note: decodeAudioData detaches the buffer, so we pass a copy or handle it carefully
  return await audioContext.decodeAudioData(bytes.buffer);
}

/**
 * Generates speech for a given text using Gemini TTS.
 */
export const generateSpeech = async (
  text: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  // Check cache first
  if (audioCache.has(text)) {
    // We need to clone the buffer because playing it might have consumed it? 
    // Actually AudioBuffers are reusable for creating sources.
    return audioCache.get(text)!;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually good for clear en-US
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }

    const audioBuffer = await decodeAudioData(base64Audio, audioContext);
    
    // Store in cache
    audioCache.set(text, audioBuffer);
    
    return audioBuffer;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
