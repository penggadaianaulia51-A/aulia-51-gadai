declare global {
  interface Window {
    google?: any;
  }
}

// Google OAuth Authentication helper using Google Identity Services (GIS)
const OAUTH_CLIENT_ID = '962167259009-m4lc8q029jft9obb1s735shp9cpq1620.apps.googleusercontent.com';

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const LOCAL_STORAGE_KEY_USERINFO = 'aulia51_google_userinfo';

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export function saveLocalUserInfo(user: GoogleUserInfo): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_USERINFO, JSON.stringify(user));
}

export function getLocalUserInfo(): GoogleUserInfo | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_USERINFO);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function removeLocalUserInfo(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY_USERINFO);
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      email: data.email || '',
      name: data.name || data.given_name || 'Pengguna Google',
      picture: data.picture,
    };
  } catch (err) {
    console.error('Failed to fetch Google User Profile:', err);
    return null;
  }
}

export function triggerGoogleLogin(
  onSuccess: (accessToken: string, userInfo: GoogleUserInfo | null) => void,
  onError: (errorMsg: string) => void
): void {
  if (typeof window === 'undefined') return;

  const handleResponse = async (response: any) => {
    if (response && response.access_token) {
      const userInfo = await fetchGoogleUserProfile(response.access_token);
      if (userInfo) {
        saveLocalUserInfo(userInfo);
      }
      onSuccess(response.access_token, userInfo);
    } else if (response && response.error) {
      onError(response.error_description || response.error || 'Login Google dibatalkan atau gagal.');
    }
  };

  const executePopup = () => {
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: OAUTH_SCOPES,
        callback: handleResponse,
        error_callback: (err: any) => {
          onError(err.message || 'Gagal membuka jendela Login Google.');
        }
      });
      client.requestAccessToken();
    } else {
      onError('Library Google Identity Services belum siap. Silakan coba beberapa detik lagi.');
    }
  };

  if (window.google?.accounts?.oauth2) {
    executePopup();
  } else {
    // Dynamically load script if not present
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => executePopup();
      script.onerror = () => onError('Gagal memuat script Google OAuth. Periksa koneksi internet Anda.');
      document.head.appendChild(script);
    } else {
      setTimeout(executePopup, 500);
    }
  }
}
