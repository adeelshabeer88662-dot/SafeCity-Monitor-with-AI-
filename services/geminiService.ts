
import { GoogleGenAI, Type } from "@google/genai";
import { ViolationType, DetectionResult } from "../types";

const DETECTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hasHelmet: { type: Type.BOOLEAN },
          plateText: { type: Type.STRING },
          headBox: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER },
            },
            required: ["ymin", "xmin", "ymax", "xmax"],
          },
          plateBox: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER },
            },
            required: ["ymin", "xmin", "ymax", "xmax"],
          },
          confidence: { type: Type.NUMBER }
        },
        required: ["hasHelmet", "plateText", "headBox", "plateBox", "confidence"],
      },
    },
  },
  required: ["detections"],
};

export const analyzeFrame = async (base64Image: string): Promise<DetectionResult[]> => {
  try {
    // Fix: Initializing GoogleGenAI with a named parameter object inside the function as per current guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Fix: Updated model to 'gemini-3-flash-preview' and used the recommended contents object structure
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: "Analyze this traffic scene. Identify motorcycle riders. For each, detect if they wear a helmet and read their license plate. Provide bounding boxes in normalized coordinates (0-1000)." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: DETECTION_SCHEMA,
      },
    });

    // Fix: Used .text property directly instead of text() method
    const text = response.text || "{\"detections\": []}";
    const result = JSON.parse(text);
    return result.detections.map((d: any, index: number) => ({
      id: `det-${Date.now()}-${index}`,
      timestamp: Date.now(),
      type: d.hasHelmet ? ViolationType.COMPLIANT : ViolationType.NO_HELMET,
      plateNumber: d.plateText || "UNKNOWN",
      headBox: d.headBox,
      plateBox: d.plateBox,
      screenshot: base64Image,
      confidence: d.confidence
    }));
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return [];
  }
};
