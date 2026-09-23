# Your EFDS committee account

**For EFDS committee members and the account administrator · September 2026**

Every committee member uses their own account. Creating an account gives you member access first. An EFDS administrator then grants committee access and connects your account to the correct officer entry, so the ticket workspace can show who owns each task.

## For committee members: five steps

1. **Open the sign-in page.** Visit [imperial-efds.com/login](https://www.imperial-efds.com/login). Use your own verified `@imperial.ac.uk` or `@ic.ac.uk` address. If you serve on the committee with a different email address, ask the EFDS administrator to approve it before continuing.
2. **Create your sign-in.** Select **First time? Set up password**, enter that email address, and select **Send setup email**. You may also choose **Sign in by email link** if you prefer not to set a password. Google sign-in may show **being configured**; use email while it is unavailable. Microsoft sign-in is no longer offered on the site.
3. **Finish from your inbox.** Open the newest EFDS sign-in email and follow its link. On the EFDS confirmation page, press **Continue**, set and confirm a password if prompted, and continue to the dashboard. Opening the email link alone does not sign you in; this protects it from automatic email-security scans. Email links expire and work only once after confirmation; request a fresh one if needed. Check junk mail if no email arrives.
4. **Request committee access.** Send the EFDS administrator your full name, the exact email you used, your official committee title, and academic year through your normal committee channel. Do not send a password or sign-in link. Your account will initially say **member access**; that is expected.
5. **Check the result.** After the administrator confirms the change, refresh or sign out and sign in again. Open [Your profile](https://www.imperial-efds.com/dashboard/profile): it should show **committee access** and your linked name, title, and academic year. Open [Tickets](https://www.imperial-efds.com/dashboard/tickets) to see committee work. If the title or access is wrong, ask the administrator to correct the link.

**Use the same email every time.** A different email or Google identity can create a separate account. Committee access and ticket assignments are attached to the account and officer entry the administrator linked.

## For the EFDS account administrator

The administrator performs the promotion after the member has signed in once. Verify the request against the current committee roster and a trusted committee channel; do not grant access based only on an email claiming a title. These steps use the EFDS knowledge-base backend and its already configured `DATABASE_URL`. Never put database credentials in a command, shared document, or chat.

1. Check [Admin → Committee](https://www.imperial-efds.com/admin/committee) to confirm the person's profile exists after first sign-in and that the active `officers` roster contains their correct full name, title, and academic year. If the roster entry is missing or wrong, correct the roster first.
2. From the `efds-knowledge-base` directory, in its configured Python environment, run:

   ```bash
   python scripts/grant_access.py person@imperial.ac.uk --role committee --officer-name "Full Roster Name"
   ```

   The command grants `committee` access and sets `profiles.officer_id` to the matching active roster entry in one transaction. It refuses an ambiguous name or an officer entry already linked to a different active account. If the same name appears in multiple years, add `--academic-year "2026/27"` (using the actual roster year).
3. Check that the command reports the correct email, name, title, and year. Ask the member to refresh or sign in again and verify **Your profile** and **Tickets**. A rerun with the same details is safe.

This role link is an internal account mapping. It does not publish the member's email or change the public committee page. Do not assign two people's accounts to the same officer entry.

## If something does not work

| What you see | What to do |
| --- | --- |
| No email arrives | Check junk mail, confirm the address, wait a few minutes, then request a new setup email. Ask the administrator to check email delivery if it still fails. |
| Link returns to the homepage or says expired | Request a new link and open only the newest one in the same browser. Send the administrator the error text, never the link or its `code=` value. |
| You can sign in but see only member access | Ask the administrator to promote the exact signed-in email. First sign-in does not grant committee access automatically. |
| Committee access appears, but your title is missing or wrong | Ask the administrator to correct the `officer` roster link. Do not create a second account. |
| Password sign-in fails | Use **Forgot password?** on the sign-in page, or choose **Sign in by email link**. |
| Google button is unavailable | Use email sign-in. Google requires separate provider configuration before it can work. |

EFDS is a student society. Its account access is managed by the society and is separate from Imperial College London's own account permissions.
