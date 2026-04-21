import { generateAvatarSVG } from '@/lib/avatar/avatar-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, accentColor, size = 128, style = 'initials' } = await request.json();

    if (!name || !accentColor) {
      return NextResponse.json(
        { error: 'name and accentColor are required' },
        { status: 400 }
      );
    }

    // Validate style
    const validStyles = ['initials', 'gradient', 'custom'];
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: `style must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = [24, 32, 48, 64, 96, 128, 256];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: `size must be one of: ${validSizes.join(', ')}` },
        { status: 400 }
      );
    }

    const svg = generateAvatarSVG({
      name,
      accentColor,
      size,
      style: style as 'initials' | 'gradient' | 'custom',
    });

    // Return as SVG
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, immutable', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Avatar generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 }
    );
  }
}

// Also support GET with query params for easier use
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const accentColor = searchParams.get('accentColor');
    const size = parseInt(searchParams.get('size') || '128', 10);
    const style = searchParams.get('style') || 'initials';

    if (!name || !accentColor) {
      return NextResponse.json(
        { error: 'name and accentColor query params are required' },
        { status: 400 }
      );
    }

    // Validate style
    const validStyles = ['initials', 'gradient', 'custom'];
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: `style must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    const svg = generateAvatarSVG({
      name,
      accentColor,
      size,
      style: style as 'initials' | 'gradient' | 'custom',
    });

    // Return as SVG
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Avatar generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 }
    );
  }
}
