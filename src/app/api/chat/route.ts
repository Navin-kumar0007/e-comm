import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { allowed } = rateLimit(clientKey(req, 'chat'), 20, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { role: 'model', content: 'You are sending messages too quickly. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        role: 'model',
        content: 'System Error: GEMINI_API_KEY is not configured. Please contact the administrator.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const userMessage = messages[messages.length - 1].content;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are a helpful AI shopping concierge for Nutty World, an online store selling natural homemade masalas, pickles, and dry fruits. Be concise and friendly. User asks: ${userMessage}`,
    });

    return NextResponse.json({
      role: 'model',
      content: response.text,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({
      role: 'model',
      content: 'I am sorry, I encountered an error while trying to respond. Please try again later.'
    });
  }
}
