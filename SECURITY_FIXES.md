# v2.0.0 — access control fixes

This delivery implements the first stage of CRM stabilization: authentication,
permission checks and company isolation. It does not close the entire stabilization issue.

## Changes

- Shared middleware rejects missing/invalid sessions and refreshes user membership
  and rank from MySQL on every protected request.
- Protected controllers also fail closed when called directly.
- Clients can only be updated/deleted within the authenticated company; company
  reassignment is forbidden and group assignments are checked before mutation.
- Group creation validates the teacher's company; updates validate the group's
  existing ownership before reassignment.
- Financial chart company selection cannot override the session's company.
- Manual expenses require manager-level permissions, consistently with expense reads.
- Removed the fake X-Session-ID calendar fallback.
- Lesson mutations validate company ownership, teacher, schedule occurrence,
  lesson/group consistency and student membership before touching attendance or money.
- Teachers cannot bypass the read-only state of completed lessons.
- Teacher lesson processing retains the planned payment rather than reading the
  accumulated balance; temporary lessons retain the previous default of 1500.
  Configurable payment rates remain a separate task.
- Financial balance writes are company-scoped, including reversals.
- Lead assignment validates employee ownership; early returns release the connection once.
- Fixed the feedback update route and included credentials on client deletion.

## Validation

Run from the repository root after installing backend dependencies:

```bash
npm ci --prefix backend
npm test --prefix backend
npm run typecheck --prefix backend
```

30 regression tests passed, including real Express HTTP requests covering all
protected routes without a session. Tests transpile the production TypeScript
modules and replace MySQL with controlled fixtures. They do not contact a real database.

The available archived dependencies do not contain dotenv. Type checking therefore
reports unresolved dotenv imports. No other TypeScript errors were reported after
these changes. A clean dependency install and integration checks against disposable
MySQL are still required. A production frontend build has not been verified in this stage.

Authentication now requires a genuine express-session cookie. A custom X-Session-ID
header is not an authentication mechanism. Verify cookie forwarding if using the
legacy PHP/Node bridge.

## Remaining stabilization work

- Atomic, precise top-ups and reliable frontend mutation error handling.
- Financial idempotency/concurrency, configurable rates and auditable corrections.
- Database/schema/view inconsistencies and historical debt calculations.
- Linux frontend build, navigation and calendar/date correctness.
- Production session persistence, cookie/CORS configuration and secret management.

Database schema changes are not included in this delivery. No production database
was modified. The customer's remote v2.0.0 branch has not been pushed or merged.
