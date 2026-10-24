import { NextResponse } from 'next/server';

// No batch records are kept yet, so every lookup says so instead of showing an invented farm journey.
export async function GET(_req: Request, { params }: { params: Promise<{ batchNumber: string }> }) {
  const { batchNumber } = await params;
  return NextResponse.json({ error: 'Batch not found', batchNumber: batchNumber.toUpperCase() }, { status: 404 });
}
