import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const type = 'wallpaper'; // Default to wallpaper for uploads

    if (!file || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: file, name, category' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['nature', 'abstract', 'minimal', 'urban', 'space', 'gradient'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for file uploads
    );

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wallpapers') // Bucket name
      .upload(`uploads/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('wallpapers')
      .getPublicUrl(`uploads/${fileName}`);

    // Save metadata to themes table
    const { data: themeData, error: dbError } = await supabase
      .from('themes')
      .insert({
        name,
        category,
        type,
        wallpaper_url: urlData.publicUrl,
        is_default: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Optionally delete uploaded file if DB insert fails
      await supabase.storage
        .from('wallpapers')
        .remove([`uploads/${fileName}`]);

      return NextResponse.json(
        { error: 'Failed to save theme metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: themeData
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
