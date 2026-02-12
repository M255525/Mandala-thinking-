import { GoogleGenAI, Type } from "@google/genai";
import { MandalaResult, ChecklistItem } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMandalaData = async (topic: string): Promise<MandalaResult> => {
  const ai = getAiClient();

  const systemInstruction = `
    你是一位專業的創意思考教練，專精於「曼陀羅思考法」(Mandalart)。
    你的目標是協助使用者將一個主題拆解為 9x9 的網格結構。
    請嚴格遵守 JSON 回傳格式，並確保每個面向都完整展開為 8 個子想法。
  `;

  const prompt = `
    你現在是一位具備創意思考與問題拆解能力的思考教練，請使用「曼陀羅思考法」協助我展開主題：{{${topic}}}

    請依照以下步驟思考：

    1. 先確認主題核心概念，用一句話描述主題焦點 (coreConcept)。
    2. 以主題為中心，展開 8 個關鍵延伸面向，形成「九宮格」概念架構 (mainDimensions)。必須剛好 8 個面向。
    3. 將每一個延伸面向，再各自延伸出 8 個具體子想法 (subGrids)。每個面向都必須有剛好 8 個子想法，不能多也不能少。
    4. 最終輸出格式請以清楚的表格呈現：

    表格 A：主題與 8 大延伸面向（3x3九宮格）
    表格 B：每個面向的 8 個子想法（共 8 張表格）

    最後請提供：
    - 對整體思考方向的簡要總結 (summary)
    - 可立即採取的 3 個行動建議 (actions)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          coreConcept: { type: Type.STRING },
          mainDimensions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "圍繞中心主題的 8 個關鍵面向。必須剛好 8 個。"
          },
          subGrids: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "針對該面向延伸出的 8 個具體子想法。必須剛好 8 個。"
                }
              },
              required: ["title", "items"]
            },
            description: "對應 8 個關鍵面向的詳細展開，必須有 8 組。"
          },
          summary: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["coreConcept", "mainDimensions", "subGrids", "summary", "actions"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini 沒有回傳回應。");
  }

  try {
    const data = JSON.parse(text) as MandalaResult;
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("無法解析創意輸出內容。");
  }
};

export const generateChecklist = async (mainTopic: string, subDimension: string): Promise<ChecklistItem[]> => {
  const ai = getAiClient();

  const prompt = `
    主題：${mainTopic}
    子面向：${subDimension}

    請針對上述「子面向」擔任專案經理的角色，制定一份具體的工作任務檢核表 (Checklist)。
    
    需求：
    1. 列出 6 到 10 項具體的執行任務 (tasks)。
    2. 每項任務需包含簡短說明 (description)。
    3. 請依據該任務對整體目標的關鍵程度，給予 1 到 5 星的重要性評分 (importance)，5 星為最重要。
    4. 輸出為 JSON 陣列。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING, description: "具體任務名稱" },
            description: { type: Type.STRING, description: "任務執行細節說明" },
            importance: { type: Type.INTEGER, description: "重要性評分 (1-5)" }
          },
          required: ["task", "description", "importance"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];

  try {
    return JSON.parse(text) as ChecklistItem[];
  } catch (error) {
    console.error("Failed to parse checklist", error);
    return [];
  }
};