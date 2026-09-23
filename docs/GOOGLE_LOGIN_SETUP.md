# Enable EFDS Google sign-in

The live Supabase Auth settings reported `google: false` on 2026-09-23. The EFDS site already has an optional Google button, the OAuth callback and session handling. It shows the button only after the provider is enabled; email and password sign-in remain available.

1. In [Google Auth Platform](https://console.cloud.google.com/auth), select a Google Cloud project. Configure Branding and Audience for the users you intend to allow. Add only the identity scopes `openid`, `userinfo.email` and `userinfo.profile`. Do not request Gmail, Drive or Calendar access for login.
2. Create a **Web application** OAuth client. Add `https://www.imperial-efds.com` as an authorized JavaScript origin. Add `https://immldithmugfrpojetmm.supabase.co/auth/v1/callback` as an authorized redirect URI. Use the exact callback URI displayed in the Supabase Google provider page if it differs from this default project URL.
3. In [Supabase Auth Providers](https://supabase.com/dashboard/project/immldithmugfrpojetmm/auth/providers), open **Google**, enter the client ID and client secret from Google, enable it, and save. Keep the secret in those dashboards; never commit it or send it in chat.
4. In Supabase Auth URL Configuration, keep Site URL `https://www.imperial-efds.com` and allow `https://www.imperial-efds.com/auth/callback`. The site starts the PKCE flow with that callback URL and exchanges the code server-side. Keep the existing `/auth/recovery` redirect for email setup/reset.
5. Open `https://www.imperial-efds.com/login` in a private browser session. The **Continue with Google** button should appear after the provider-settings cache refreshes (up to five minutes). Complete sign-in with an eligible Imperial account, confirm arrival at `/dashboard`, reload, and confirm the session persists. An ineligible account should reach `/access-denied`. Test email/password separately afterward.

For a command-line provider check, copy the project's **publishable** key from Supabase Project Settings → API and supply it locally. The command prints only the provider state:

```bash
cd /home/siheon/projects/efds-site
read -r -s -p 'Supabase publishable key: ' EFDS_PUBLISHABLE_KEY; printf '\n'
EFDS_PUBLISHABLE_KEY="$EFDS_PUBLISHABLE_KEY" python3 - <<'PY'
import json, os, urllib.request
request = urllib.request.Request(
    'https://immldithmugfrpojetmm.supabase.co/auth/v1/settings',
    headers={'apikey': os.environ['EFDS_PUBLISHABLE_KEY']},
)
with urllib.request.urlopen(request, timeout=15) as response:
    settings = json.load(response)
print('Google enabled:', settings.get('external', {}).get('google') is True)
PY
unset EFDS_PUBLISHABLE_KEY
```

If Google reports enabled but the sign-in button stays hidden, check the deployed site's Supabase URL and publishable key, wait five minutes for the server cache, then reload `/login`. If Google shows `redirect_uri_mismatch`, compare the exact Google redirect URI with the callback shown in Supabase. [Supabase's Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google) and [Google's OAuth web guide](https://developers.google.com/identity/protocols/oauth2/web-server) describe the provider setup.
