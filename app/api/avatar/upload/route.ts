import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userType = formData.get('userType') as string | null; // 'pro' or 'client'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Create unique filename
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `${timestamp}.${extension}`;
    const bucket = 'avatars';
    const path = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    // Update appropriate table based on user type
    if (userType === 'pro') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_photo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Don't fail the request, just log the error
      }
    } else if (userType === 'client') {
      // For clients, we need to update client_profiles table
      // Note: Using user_id field since clients use Clerk
      const { error: updateError } = await supabase
        .from('client_profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Client profile update error:', updateError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: path,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove avatar photo
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || 'client';

    const supabase = createServerSupabaseClient();

    if (userType === 'pro') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_photo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to remove avatar from profile' },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from('client_profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to remove avatar from client profile' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}
