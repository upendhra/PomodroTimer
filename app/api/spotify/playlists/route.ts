import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated with Spotify' },
      { status: 401 }
    );
  }

  try {
    // Fetch user's playlists
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, need to refresh
        return NextResponse.json(
          { error: 'Token expired', needsRefresh: true },
          { status: 401 }
        );
      }
      throw new Error('Failed to fetch playlists');
    }

    const data = await response.json();

    // Transform playlist data to include only necessary fields
    const playlists = data.items.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images,
      tracks: {
        total: playlist.tracks.total,
      },
      owner: {
        display_name: playlist.owner.display_name,
      },
      public: playlist.public,
    }));

    return NextResponse.json({
      success: true,
      playlists: playlists,
      total: data.total,
    });
  } catch (error) {
    console.error('Error fetching Spotify playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}
