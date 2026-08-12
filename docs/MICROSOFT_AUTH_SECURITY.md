# EFDS Society — Microsoft Authentication Security

Audit date: 12 August 2026

This document describes the Microsoft authentication boundary implemented by the EFDS website. It is based on the repository source, the installed Supabase client packages, and the current Supabase Auth Azure provider implementation. The Microsoft Entra tenant and Supabase project settings must still be checked against this document before production approval.

## Purpose

Microsoft Entra ID is used only as an identity provider for EFDS. It authenticates the person, supplies basic OpenID Connect identity claims and an email claim, and allows EFDS to decide whether that email is an Imperial address or an approved external exception.

Authentication answers “who is this user?”. It does not grant EFDS membership, a role, or access to Microsoft resources.

## Authentication architecture

```text
Imperial Microsoft Account
        ↓
Microsoft Entra ID
        ↓
Supabase Auth (Azure provider)
        ↓
EFDS Next.js application
        ↓
EFDS authorization/profile system
```

The browser calls Supabase Auth with the Azure provider. Supabase Auth handles the provider callback and returns an authorization code to the EFDS `/auth/callback` route. That route exchanges the code server-side, reads the authenticated Supabase user, provisions or links an EFDS profile when policy permits, evaluates access, and redirects to the dashboard or access-denied page.

The application-side callback is `https://<EFDS-site-origin>/auth/callback`. The Supabase-side provider callback is the project callback at `https://<supabase-project-ref>.supabase.co/auth/v1/callback`.

## Requested scopes

The explicit EFDS OAuth configuration is centralized in `lib/auth/microsoft.ts` and is passed to `signInWithOAuth` from `components/auth/login-form.tsx`:

```ts
provider: "azure"
scopes: "openid profile email"
```

| Scope | Type | Purpose | Required? | Data exposed |
| --- | --- | --- | --- | --- |
| `openid` | OpenID Connect | Authenticate the user and identify the subject | Yes | A stable subject claim and an ID token |
| `profile` | OpenID Connect | Supply basic identity information | Yes | Basic profile claims used for identity/profile display, such as name and preferred username |
| `email` | OpenID Connect | Supply the authenticated email claim | Yes | The primary email claim when one is associated with the account |
| `offline_access` | OpenID Connect | Obtain a provider refresh token for longer-lived access to provider resources | No in EFDS | Not explicitly requested by EFDS; see below |
| `User.Read` | Microsoft Graph delegated permission | Read the signed-in user's Microsoft Graph profile | No | Not requested by EFDS |

OpenID Connect identity scopes and Microsoft Graph permissions are distinct categories. EFDS requests identity claims, not a Microsoft Graph API permission. The `profile` claim does not give EFDS a Graph API client or directory-query capability.

The installed Supabase JavaScript client passes the supplied `options.scopes` value through to Supabase Auth; it does not add `offline_access` or `User.Read`. The Azure provider implementation inspected for Supabase Auth starts with its required `openid` provider default and combines the caller's scopes. It does not add `offline_access` or Microsoft Graph data permissions. Consequently, the effective permission intent remains `openid`, `profile`, and `email`; an implementation-level duplicate of `openid` is not an additional permission.

Microsoft documents that the “Maintain access to data you have given it access to” wording can appear on consent pages even for flows that do not provide a refresh token. EFDS does not explicitly request `offline_access`, and the EFDS code does not use a Microsoft provider refresh token or call a Microsoft resource after login. Supabase session persistence uses the Supabase Auth session, not an EFDS request for Microsoft Graph access. The final production authorization URL should nevertheless be checked once in the configured Supabase project as an operational verification.

References: [Supabase Azure login](https://supabase.com/docs/guides/auth/social-login/auth-azure), [Microsoft identity platform scopes](https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc), and the [Supabase Auth Azure provider implementation](https://github.com/supabase/auth/blob/master/internal/api/provider/azure.go).

## Microsoft Graph

EFDS does not call the Microsoft Graph API.

The repository contains no Graph HTTP calls, Graph SDK package, MSAL package, `graph.microsoft.com` endpoint, `User.Read` request, or Microsoft Graph access-token use. `microsoft_graph` appears only as a future integration type/roadmap label; it is not implemented or invoked by authentication or any application route.

EFDS does not request or use access to:

- Mail or mailboxes
- Calendars
- OneDrive
- SharePoint
- Teams
- Contacts
- Microsoft 365 files
- Groups
- Organization or directory-wide user information

There are no Microsoft Graph delegated permissions and no Microsoft Graph application permissions in application code. In particular, `User.Read` is not required for the current authentication implementation because the identity claims are sufficient.

## Data retained by EFDS

The EFDS application reads the authenticated Supabase user ID, email, email-confirmation status, and the `full_name` or `name` user metadata claim during profile provisioning. Its application profile boundary reads or writes these fields:

- `id`
- `auth_user_id`
- `email`
- `full_name`
- `access_role`
- `member_type`
- `officer_id`
- `active`
- `last_login_at`

Existing access roles are preserved when a returning profile is updated. EFDS code does not read or use a Microsoft provider access token, provider refresh token, or Graph response. Supabase Auth remains responsible for the Supabase authentication session and its cookie/session lifecycle.

## Authorization

Successful Microsoft authentication does not automatically grant privileged EFDS access.

For a verified usable email, EFDS normalizes it case-insensitively and accepts only the configured exact domains `ic.ac.uk` and `imperial.ac.uk`. Other addresses require the existing approved external-email exception path. The authorization decision and profile lookup occur server-side. Missing/unconfirmed email, an unauthorized domain, a missing profile, or an inactive profile is rejected.

The existing role hierarchy is:

```text
viewer → member → committee → admin
```

The callback provisions an allowed profile, does not downgrade an existing role, and does not allow an external exception to self-provision an admin profile. Private layouts and role checks resolve the server-side profile, and the application continues to rely on matching server-side/RLS authorization assumptions for database access. Agent scopes remain bounded independently of Microsoft claims.

The external magic-link flow remains separate. It checks the narrow `is_external_email_eligible` RPC before sending an OTP and repeats the access decision in the callback path; it does not use Microsoft scopes.

## Secrets

The browser receives only the public Supabase URL/key configuration needed to create a Supabase browser client. No Microsoft client secret is present in `NEXT_PUBLIC_*` configuration, source code, or tracked repository files. In this hosted-Supabase architecture, the Microsoft client secret belongs in the Supabase Auth Azure provider configuration and is used by Supabase Auth server-side.

The local `.env` file is ignored and untracked. Secrets are not reproduced in this document or in test output.

## Redirects

The expected flow is:

```text
Microsoft Entra ID
        → Supabase /auth/v1/callback
        → EFDS /auth/callback
```

The Microsoft login callback is built from the current browser origin and the fixed `/auth/callback` path; it does not accept a user-supplied redirect URL. The external magic-link callback uses the configured EFDS site URL and the same fixed callback path. The EFDS callback accepts an optional `next` value only after `safeInternalPath` rejects absolute URLs, protocol-relative URLs, backslashes, and non-path values.

Supabase Auth must have the production EFDS callback URL in its allowed redirect URL list. The Entra application must use the Supabase Auth provider callback supplied by the Supabase project, not a browser-exposed client secret or a direct Graph callback.

## Entra configuration guidance

For `EFDS Society` in Microsoft Entra admin center:

1. Keep the intended multitenant/account configuration that permits Imperial College London users.
2. Under **API permissions**, remove **Microsoft Graph → User.Read → Delegated**. The EFDS code does not require it.
3. Do not add any Microsoft Graph delegated or application permission.
4. Keep the Supabase Auth callback configured as the provider redirect URI.
5. Keep the production EFDS origin/callback in Supabase Auth's allowed redirect URLs.

The API-permission state should contain no Microsoft Graph data permission for EFDS. The identity scopes used at sign-in are `openid profile email`; they are not a request for mail, files, calendar, directory, or other Microsoft 365 API access.

## Third-party services

### Microsoft Entra ID

Authenticates the Imperial Microsoft account and issues the OIDC identity response.

### Supabase Auth

Acts as the configured Azure OAuth broker and authentication/session service. It exchanges the provider authorization code, validates the OIDC response, and supplies the authenticated Supabase user to EFDS.

### Vercel / EFDS Next.js application

Hosts the EFDS application and its server-side callback/authorization logic. EFDS evaluates Imperial-domain membership, external exceptions, profile state, and role independently of Microsoft.

No certification or compliance claim is made here about any third-party service.
