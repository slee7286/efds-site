# External exception authentication

Microsoft remains the primary authentication method for Imperial users. The
email/password and email-link paths are only for identities with an active,
unexpired row in the backend-owned `auth_access_exceptions` table.

## Flows

```text
approved exception
    ↓ narrow boolean eligibility RPC
Supabase allowlisted email link (first setup)
    ↓ /auth/recovery code exchange
/auth/set-password
    ↓ updateUser({ password })
/api/auth/external/authorize
    ↓ active exception + active profile + role
dashboard
```

Password login uses `signInWithPassword`, followed immediately by the same
server authorization endpoint. First-time setup uses the allowlisted
`signInWithOtp` flow because Supabase password recovery cannot create a new
Auth identity. Forgotten-password uses `resetPasswordForEmail` for existing
Auth identities. There is no public `signUp` call and no custom password
hashing or reset-token storage.

## Authorization and revocation

Supabase authentication proves control of an account; it does not grant EFDS
access. Every private request still checks the authenticated user, normalized
email, authentication provider, current exception/Imperial policy, active
profile, and required role. A password can remain valid after an exception is
disabled or expires, but the EFDS private routes deny access and the password
authorization endpoint signs the session out.

Microsoft-authenticated `@ic.ac.uk` and `@imperial.ac.uk` users use the normal
domain policy. An Imperial-domain account using email/password or an email
link must have an explicit active exception, which supports temporary local
development access without changing Microsoft OAuth.

## Supabase configuration

Verify manually in Supabase Dashboard:

- Email provider and email/password authentication are enabled.
- Recovery emails are enabled and deliverable.
- Password policy has the desired minimum length; the website requires at
  least 8 characters and matching confirmation fields.
- Rate limits and SMTP/email delivery are suitable for the environment.
- Site URL is `https://www.imperial-efds.com` in production.
- Allowed redirect URLs include:

  ```text
  https://www.imperial-efds.com/auth/callback
  https://www.imperial-efds.com/auth/recovery
  http://localhost:4587/auth/callback
  http://localhost:4587/auth/recovery
  ```

The recovery URL may contain the generated `flow=setup` or `flow=reset`
query parameter. Do not add service-role keys to the website.

## Onboarding and revocation

From the backend schema-owner repository, create an exception:

```powershell
python scripts/set_access_exception.py external@example.com --role viewer --reason "Approved EFDS external user" --expires-at 2027-09-01T00:00:00Z
```

The user visits `/login`, chooses **First time? Set up password**, receives
the Supabase email, follows it, and sets a password. They can later use
email/password, forgot-password, or the email-link fallback.

To revoke access, deactivate or expire the exception through the controlled
backend/admin workflow. No password deletion is required: the next EFDS
authorization check denies the user regardless of Supabase credentials.
