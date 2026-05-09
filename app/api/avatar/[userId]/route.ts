import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateAvatarSVG, getColorFromName, svgToDataURI } from '@/lib/avatar/avatar-generator';
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('type') || 'client'; // 'pro' or 'client'
    const size = parseInt(searchParams.get('size') || '128', 10);
    const style = searchParams.get('style') || 'initials';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    let photoUrl: string | null = null;
    let userName = '';
    let accentColor: string | null = null;
    let avatarStyle = style;

    if (userType === 'pro') {
      // Get PRO profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_photo_url, business_name, accent_color, avatar_style')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      photoUrl = profile?.profile_photo_url || null;
      userName = profile?.business_name || 'Pro';
      accentColor = profile?.accent_color || null;
      avatarStyle = profile?.avatar_style || style;
    } else {
      // Get CLIENT profile data
      const { data: clientProfile, error } = await supabase
        .from('client_profiles')
        .select('avatar_url, first_name, last_name, accent_color, avatar_style')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Client profile fetch error:', error);
        // Generate generic avatar if no profile found
        userName = 'User';
      } else {
        photoUrl = clientProfile?.avatar_url || null;
        userName = `${clientProfile?.first_name || ''} ${clientProfile?.last_name || ''}`.trim() || 'User';
        accentColor = clientProfile?.accent_color || null;
        avatarStyle = clientProfile?.avatar_style || style;
      }
    }

    // If photo URL exists, redirect to it
    if (photoUrl) {
      return NextResponse.redirect(photoUrl);
    }

    // No photo - generate avatar
    const effectiveColor = accentColor || getColorFromName(userName);
    const svg = generateAvatarSVG({
      name: userName,
      accentColor: effectiveColor,
      size,
      style: avatarStyle as 'initials' | 'gradient' | 'custom',
    });

    // Return SVG directly
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    logger.error('Avatar fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    );
  }
}
