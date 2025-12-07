import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis } from "../types";

// Note: 'process' is now automatically defined by @types/node

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image and estimate the nutritional content. If it is not food, return a result with foodName 'Unknown' and 0 values.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "Name of the dish or food item" },
            calories: { type: Type.NUMBER, description: "Estimated total calories" },
            protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
            carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
            fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as FoodAnalysis;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback error object
    return {
      foodName: "Lỗi phân tích",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0,
    };
  }
};