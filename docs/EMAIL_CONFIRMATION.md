# Email confirmation and security scanners

Email sign-in, first-time password setup and password reset use `/auth/confirm`.
Opening that page does not call Supabase verification. The member must submit
the Continue button. A same-origin check and a short-lived HttpOnly confirmation
cookie protect the POST. Only then does the server call `verifyOtp`, provision
or load the existing EFDS profile, and apply the usual access checks.

This supports existing Auth users who have never reached the dashboard. It
does not recreate accounts, reset existing roles or grant committee access.

The confirmation response is not cached, sends only the origin as its referrer,
loads no scripts or third-party assets, and cannot be embedded in another page.
`Referrer-Policy: strict-origin` hides the token-bearing path and query while
preserving the native form POST's `Origin` header. Do not use `no-referrer` here:
browsers then send `Origin: null`, which the same-origin check must reject.
Do not add analytics to this route or log its token, request URL or form body.

## Production configuration

Deploy the route before changing Supabase Authentication > Emails templates:

| Supabase template | Repository file |
| --- | --- |
| Confirm sign up | `supabase/templates/confirmation.html` |
| Magic link or OTP | `supabase/templates/magic-link.html` |
| Reset password | `supabase/templates/recovery.html` |

The Site URL is `https://www.imperial-efds.com`. Keep these exact recovery
destinations in the redirect allow list, including their query strings, so
`RedirectTo` preserves first-time setup intent:

- `https://www.imperial-efds.com/auth/recovery?flow=setup`
- `https://www.imperial-efds.com/auth/recovery?flow=reset`

Retain the existing callback URL for OAuth and emails issued before this change.
Old emails still contain the old verification links; request a new email after
the templates change. No expiry or one-time-token protection is disabled.

For a targeted resend, select only users with a null Auth `last_sign_in_at`, no
existing session, no application `last_login_at`, and no successful sign-in in
available audit history. Recheck immediately before sending through the site's
password-setup endpoint. Record accepted sends separately from inbox delivery
and completed sign-in. Do not retry an ambiguous send automatically.

References: https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching
