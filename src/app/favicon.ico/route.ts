// Temporary route to serve favicon
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const svgPath = path.join(process.cwd(), 'public', 'favicon.ico.svg');
    const svg = fs.readFileSync(svgPath, 'utf-8');

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Favicon not found', { status: 404 });
  }
}
