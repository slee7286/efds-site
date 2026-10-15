# Your EFDS committee account

**For EFDS committee members and account administrators · September 2026**

Use your own account. Eligible new accounts start as **EFDS members**, with full event access and public resources. An EFDS administrator can verify enrolment on Imperial’s BSc Economics, Finance and Data Science, granting **EFDS student** access to student resources. EFDS Union society membership alone does not grant student access. Committee access and your officer roster identity are further, separate steps.

## For committee members

1. **Create your account.** Visit [imperial-efds.com/signup](https://www.imperial-efds.com/signup). Use your own `@imperial.ac.uk` or `@ic.ac.uk` address. If you serve on the committee with a different address, ask an EFDS administrator to approve that address first. Select **Email me an account link**, open the newest email, press **Continue**, and set a password. Email ownership confirmation gives you EFDS member dashboard access immediately; student verification is a later, separate review. You can also use an email sign-in link, or Google sign-in if its button is available. Microsoft sign-in is not offered.
2. **Finish from your inbox.** Open the newest EFDS email, then press **Continue** on the EFDS confirmation page. Set and confirm a password if prompted. Opening the link alone does not sign you in; the extra step protects against automatic email-security scans. If the link has expired, request a new one. Do not share it.
3. **Request EFDS student verification.** If you are enrolled on the EFDS BSc, open [Your profile](https://www.imperial-efds.com/dashboard/profile). Under **Student verification**, provide your degree and cohort, then select **Send for review**. Do not include your student ID or documents. Your university email does not prove degree enrolment. Your EFDS member account keeps full event access while the review is pending.
4. **Tell the administrator your committee identity.** In your usual committee channel, share your full name, the exact account email, your official committee title and academic year. Never share a password, email sign-in link or reset code.
5. **Check your access.** After an administrator confirms verification, committee access and your officer link, refresh [Your profile](https://www.imperial-efds.com/dashboard/profile). It should show **Committee** and the correct name, title and academic year. Open [Tickets](https://www.imperial-efds.com/dashboard/tickets) to see committee work. Ask the administrator to correct any mismatch; do not create a second account.

**Keep one account.** Signing in with a different email can create a separate identity. The account and officer roster entry are what connect you to ticket assignments.

## For EFDS account administrators

Use the [Accounts review panel](https://www.imperial-efds.com/admin/accounts), which opens on **All active accounts** by default. This includes EFDS members who have not submitted a student-verification claim. **Needs review** is the explicit [`?status=pending`](https://www.imperial-efds.com/admin/accounts?status=pending) filter and shows only submitted student-verification requests; it is not a directory of every registration. **Non-EFDS students** keeps its separate decision filter. Active accounts remain paginated.

Check an independent degree or cohort record through a trusted source. A name, Imperial email, society membership or self-description alone is not sufficient evidence. Members without a submitted claim can also be reviewed from **All active accounts** when independent evidence establishes their EFDS degree enrolment; do not infer enrolment from a missing claim. The panel records the acting admin, decision and date. It prevents direct role changes, stale edits and more than two active accounts linking to the same officer entry.

1. **Verify EFDS student status.** Open the person's exact account in **Needs review** for a submitted claim, or **All active accounts** if they have not submitted one. Compare any claim with an independent degree record and establish enrolment from that record before approval. Select **Verify EFDS student status** and save. If the person is not an EFDS student, select **Confirm non-EFDS student**. The account keeps EFDS member event and public access, moves to **Non-EFDS students**, and can still be promoted later if their enrolment changes or the decision was mistaken.
2. **Grant committee access.** After verification, switch to **All active accounts**, find that account, select **Grant committee access** and save. Verification and promotion are deliberately separate decisions.
3. **Link the correct officer entry.** Open [Admin → Committee](https://www.imperial-efds.com/admin/committee). On the matching officer card, enter the member's exact account email and select **Link account**. Each officer role accepts up to two accounts; each account can link to only one role. The account must already have committee or admin access. To correct a mistaken link, select **Remove link** beside that account before assigning another.
4. **Check the outcome.** Ask the member to refresh their profile and ticket dashboard. Use the account panel's recent access decisions to confirm what changed and when, and check its account-email delivery status. Linking or removing a roster identity queues an email to the affected account. Admin promotion cannot be applied to an unverified account. An admin cannot change their own role or remove the last active admin.

### Registrations without profiles

The always-visible **Registrations without profiles** section is separate from the active-account directory, its filters and pagination. It shows up to 1,000 Auth registrations that have no application profile, with their registration time, email-confirmation status and reason. These registrations have no profile ID and no verification, promotion or officer-link controls.

- **Account disabled:** ask an authorised operator to review the Auth restriction. Do not bypass it by creating a profile or granting roles.
- **Email confirmation pending:** the person must request a new sign-in or signup email themselves, open the newest email and complete confirmation. Administrators must not force-confirm the email or promote the registration to bypass ownership checks.
- **Email not eligible:** check the exact address and, where appropriate, the approved external-access process with an authorised operator. Registration alone does not establish eligibility.
- **Profile conflict:** ask an authorised operator to investigate the conflicting identity. Do not create a second account or work around it by changing roles.
- **Profile missing:** email ownership is confirmed, but the application profile is absent. Ask an authorised operator to investigate profile provisioning before reviewing access.

Eligible confirmed registrations are provisioned by the database; callback provisioning is an idempotent fallback that must preserve stored roles and inactive accounts. Email confirmation is not EFDS degree verification or committee approval. If this section cannot load, investigate the reported RPC or database migration error rather than treating it as an empty queue.

The old `grant_access.py` database command remains a bootstrap or recovery tool for an authorised operator; routine account reviews now belong in the audited dashboard. Do not put database credentials in a command, shared document or chat.

## If something does not work

| What you see | What to do |
| --- | --- |
| No email arrives | Check junk mail, confirm the address, wait a few minutes, then request a new email. Ask an admin to inspect delivery health if it still fails. |
| The link opens the homepage or says expired | Request a fresh link and open the newest one. Send an admin the error text, never the link or its code. |
| You can sign in, but only see EFDS member access | If you study the EFDS BSc, submit your degree and cohort on your profile; ask an admin to review the exact account email. Union society membership alone does not grant student resources. |
| EFDS student access is active, but Tickets is missing | Ask an admin to grant committee access and link your roster identity. |
| Committee access appears, but your title is wrong | Ask an admin to correct the officer link. Do not make another account. |
| Password sign-in fails | Use **Forgot password?** or an email sign-in link. |
| Google sign-in is unavailable | Use email sign-in. Google requires separate provider configuration. |

EFDS is a student society. Its account access is managed by the society and is separate from Imperial College London's account permissions.
