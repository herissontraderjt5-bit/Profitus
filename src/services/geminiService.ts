import { GoogleGenAI } from "@google/genai";
import { MarketAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeMarket(asset: string, timeframe: string): Promise<MarketAnalysis> {
  console.log(`Iniciando análise para ${asset} no timeframe ${timeframe}...`);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise profissional de OPÇÕES BINÁRIAS para o ativo ${asset} na corretora Bullex. 
      Timeframe: ${timeframe}.
      FOCO: Operação para FINAL DE VELA de ${timeframe}.
      Considere confluências técnicas (RSI, Médias Móveis, Suporte/Resistência, Volume).
      Retorne um JSON estrito com:
      {
        "signal": "BUY" | "SELL" | "NEUTRAL",
        "confidence": 0-100,
        "reasoning": "explicação técnica curta focada em OB e final de vela",
        "confluences": ["confluência 1", "confluência 2"]
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}") as MarketAnalysis;
    console.log("Resultado da análise:", result);
    return result;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      signal: "NEUTRAL",
      confidence: 0,
      reasoning: "Erro na análise da IA",
      confluences: []
    };
  }
}
