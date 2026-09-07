import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth-guard';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    // Only authenticated admins may upload.
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary is configured, upload there
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'spicy-nuts' }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      });
      return NextResponse.json({ url: (result as any).secure_url });
    } else {
      // Fallback: Save to local public/uploads with a safe, generated filename.
      const ext = EXT_BY_TYPE[file.type] || 'bin';
      const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      await require('fs').promises.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      return NextResponse.json({ url: `/uploads/${filename}` });
    }
  } catch (error: any) {
    if (error?.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
