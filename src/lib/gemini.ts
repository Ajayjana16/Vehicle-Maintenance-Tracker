import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  fallbackAnalyzeDiagnostic,
  fallbackParseReceipt,
} from "./fallback-ai";
import { DiagnosticAnalysisResult, ParsedReceiptResult } from "@/types";

export function getGeminiClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function analyzeVehicleDiagnosticAI(
  vehicleInfo: { make: string; model: string; year: number; mileage: number; fuelType: string },
  codes: string,
  symptoms?: string,
  apiKey?: string
): Promise<DiagnosticAnalysisResult> {
  const client = getGeminiClient(apiKey);

  if (!client) {
    return fallbackAnalyzeDiagnostic(codes, symptoms);
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an ASE Master Certified Automotive Diagnostic AI.
Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.fuelType}, ${vehicleInfo.mileage} miles).
OBD-II Codes: ${codes || "None provided"}
User Symptoms: ${symptoms || "None provided"}

Analyze the issue and return a JSON object with this exact schema:
{
  "severity": "CRITICAL" | "MODERATE" | "MINOR",
  "canDrive": boolean,
  "aiSummary": "2-3 sentences explaining the root mechanism and safety risk",
  "possibleCauses": ["cause 1", "cause 2", "cause 3", "cause 4"],
  "diySteps": ["step 1 inspection", "step 2 testing", "step 3 fix"],
  "estimatedCostMin": number (USD minimum repair cost),
  "estimatedCostMax": number (USD maximum repair cost)
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const parsed = JSON.parse(text);

    return {
      severity: parsed.severity || "MODERATE",
      canDrive: typeof parsed.canDrive === "boolean" ? parsed.canDrive : true,
      aiSummary: parsed.aiSummary || "Vehicle diagnostic analysis completed.",
      possibleCauses: parsed.possibleCauses || ["Sensor issue", "Mechanical wear"],
      diySteps: parsed.diySteps || ["Inspect related wiring and connectors", "Scan live data"],
      estimatedCostMin: Number(parsed.estimatedCostMin) || 100,
      estimatedCostMax: Number(parsed.estimatedCostMax) || 350,
    };
  } catch (error) {
    console.warn("Gemini API call failed, using heuristic automotive fallback:", error);
    return fallbackAnalyzeDiagnostic(codes, symptoms);
  }
}

export async function parseInvoiceReceiptAI(
  receiptText: string,
  apiKey?: string
): Promise<ParsedReceiptResult> {
  const client = getGeminiClient(apiKey);

  if (!client) {
    return fallbackParseReceipt(receiptText);
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an AI invoice parser specializing in automotive repair orders and service receipts.
Analyze this invoice text and extract the structured data:
"""
${receiptText}
"""

Return a JSON object with this exact schema:
{
  "title": "Concise title of service (e.g. 'Brake Pad & Rotor Replacement')",
  "serviceType": "OIL_CHANGE" | "BRAKES" | "TIRES" | "BATTERY" | "FLUIDS" | "INSPECTION" | "REPAIR" | "RECALL" | "GENERAL",
  "serviceDate": "YYYY-MM-DD",
  "mileage": number or null,
  "cost": number (total amount paid in USD),
  "provider": "Mechanic or shop name",
  "partsReplaced": ["part 1", "part 2"],
  "notes": "Brief summary of work done and warranty details"
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || "Vehicle Maintenance Service",
      serviceType: parsed.serviceType || "GENERAL",
      serviceDate: parsed.serviceDate || new Date().toISOString().split("T")[0],
      mileage: parsed.mileage ? Number(parsed.mileage) : null,
      cost: Number(parsed.cost) || 120.0,
      provider: parsed.provider || "Auto Service Center",
      partsReplaced: parsed.partsReplaced || [],
      notes: parsed.notes || "Parsed via Gemini AI.",
    };
  } catch (error) {
    console.warn("Gemini receipt parsing failed, using heuristic fallback:", error);
    return fallbackParseReceipt(receiptText);
  }
}
