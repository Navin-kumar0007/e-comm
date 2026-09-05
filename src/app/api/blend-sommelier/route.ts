import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { allowed } = rateLimit(clientKey(req, 'blend'), 15, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on this server.'
      }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstructions = `You are an expert master spice sommelier and sensory blender. 
Your task is to take the user's culinary request and output a detailed, custom spice recipe.
You must choose the single best spice for each of the three categories:
1. Base Spice: Choose one of ['turmeric', 'coriander', 'cumin', 'fennel', 'mustard']
2. Heat Spice: Choose one of ['mild', 'medium', 'hot', 'ghost', 'pepper']
3. Aromatic Spice: Choose one of ['cardamom', 'clove', 'cinnamon', 'anise', 'nutmeg']

You must also determine the percentage ratio for each category:
- baseRatio (0-100)
- heatRatio (0-100)
- aromaticRatio (0-100)

CRITICAL: The sum of baseRatio + heatRatio + aromaticRatio MUST be exactly 100.
Formulate the ratios logically based on the flavor profile requested.
Ensure you return a professional, premium name and a rich sensory description.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Culinary request: "${prompt}"`,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            baseSpice: { type: Type.STRING },
            heatSpice: { type: Type.STRING },
            aromaticSpice: { type: Type.STRING },
            baseRatio: { type: Type.INTEGER },
            heatRatio: { type: Type.INTEGER },
            aromaticRatio: { type: Type.INTEGER },
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: [
            'baseSpice', 'heatSpice', 'aromaticSpice', 
            'baseRatio', 'heatRatio', 'aromaticRatio', 
            'name', 'description'
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini API');
    }

    const data = JSON.parse(resultText);

    // Sanitize ratios: Ensure they sum to exactly 100
    let b = Number(data.baseRatio) || 0;
    let h = Number(data.heatRatio) || 0;
    let a = Number(data.aromaticRatio) || 0;
    const total = b + h + a;
    
    if (total !== 100 && total > 0) {
      b = Math.round((b / total) * 100);
      h = Math.round((h / total) * 100);
      a = 100 - b - h;
    } else if (total === 0) {
      b = 40;
      h = 30;
      a = 30;
    }

    return NextResponse.json({
      success: true,
      baseSpice: data.baseSpice,
      heatSpice: data.heatSpice,
      aromaticSpice: data.aromaticSpice,
      baseRatio: b,
      heatRatio: h,
      aromaticRatio: a,
      name: data.name,
      description: data.description
    });

  } catch (error: any) {
    console.error('Sommelier API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse recipe suggestion.'
    }, { status: 500 });
  }
}
