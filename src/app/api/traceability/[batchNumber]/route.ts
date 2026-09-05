import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ batchNumber: string }> }) {
  try {
    const { batchNumber } = await params;
    
    // In a real app we'd fetch from DB:
    // const batch = await prisma.batch.findUnique({ where: { batchNumber } });
    // For demo purposes, we will return a rich mock response if not found in DB
    
    const timeline = [
      {
        date: "12 Oct 2026",
        title: "Harvested at Sunrise Farm",
        description: "Hand-picked by our organic farming partners in Kerala.",
        icon: "leaf"
      },
      {
        date: "15 Oct 2026",
        title: "Quality & Purity Testing",
        description: "Tested for 0% pesticide residue and heavy metals. Passed with Grade A+.",
        icon: "shield"
      },
      {
        date: "18 Oct 2026",
        title: "Sun-Dried & Ground",
        description: "Traditionally sun-dried to preserve essential oils and aroma.",
        icon: "sun"
      },
      {
        date: "20 Oct 2026",
        title: "Packaged at Nutty World",
        description: "Sealed in eco-friendly, aroma-lock packaging.",
        icon: "package"
      }
    ];

    return NextResponse.json({
      batchNumber: batchNumber.toUpperCase(),
      productName: "Organic Kashmiri Chili Powder",
      farmOrigin: "Kerala, India",
      certifications: ["USDA Organic", "Non-GMO", "Fair Trade"],
      timeline
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
