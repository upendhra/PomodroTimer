import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

  if (!accessToken) {
    return NextResponse.json({
      authenticated: false,
      hasRefreshToken: !!refreshToken,
    });
  }

  try {
    // Verify token by fetching user profile
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      return NextResponse.json({
        authenticated: true,
        user: {
          id: userData.id,
          display_name: userData.display_name,
          email: userData.email,
          images: userData.images,
        },
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        hasRefreshToken: !!refreshToken,
        needsRefresh: response.status === 401,
      });
    }
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return NextResponse.json({
      authenticated: false,
      hasRefreshToken: !!refreshToken,
      error: 'Failed to verify authentication',
    });
  }
}
