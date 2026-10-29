import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

// Extension comes from the validated MIME type, never the user's filename
// (a file named "x.html" must not be stored and served as a web page).
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const ALLOWED_TYPES = Object.keys(EXT_BY_TYPE);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Storage not configured — BLOB_READ_WRITE_TOKEN missing' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 8 MB' }, { status: 400 });
  }

  const filename = `priests/${userId}/${Date.now()}.${EXT_BY_TYPE[file.type]}`;

  const blob = await put(filename, file, { access: 'public', contentType: file.type });

  return NextResponse.json({ url: blob.url });
}
