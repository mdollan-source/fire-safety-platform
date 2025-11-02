// Temporary route to serve icon until PNG is created
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
    const svg = fs.readFileSync(svgPath, 'utf-8');

    // For MVP, serve SVG with PNG content-type
    // Browser will handle it reasonably well
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Icon not found', { status: 404 });
  }
}
