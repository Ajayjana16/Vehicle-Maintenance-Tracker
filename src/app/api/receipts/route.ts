import { NextResponse } from "next/server";
import { parseInvoiceReceiptAI } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { receiptText, apiKey } = body;

    if (!receiptText || typeof receiptText !== "string" || receiptText.trim() === "") {
      return NextResponse.json({ error: "Receipt text is required" }, { status: 400 });
    }

    const parsed = await parseInvoiceReceiptAI(receiptText, apiKey);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return NextResponse.json({ error: "Failed to parse receipt" }, { status: 500 });
  }
}
