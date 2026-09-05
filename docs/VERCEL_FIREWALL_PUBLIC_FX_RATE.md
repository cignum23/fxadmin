# Vercel Firewall Rule for Public FX Rate

## Problem

Wallet requests to `/api/fx/public/current-rate` can receive a Vercel edge `429`
before the Next.js route runs.

The distinguishing headers are:

```text
HTTP/1.1 429 Too Many Requests
Content-Type: text/html; charset=utf-8
Server: Vercel
X-Vercel-Mitigated: challenge
X-Vercel-Challenge-Token: ...
```

That response is the Vercel Security Checkpoint, not this app's route-level rate
limiter. The app-level limiter returns JSON and includes `Retry-After: 60` and
`X-RateLimit-Limit`.

## Required Fix

Add a scoped Vercel Firewall custom rule for the `fxadmin` production project:

- Name: `Bypass wallet public FX rate API`
- Action: `bypass`
- Conditions:
  - `path` equals `/api/fx/public/current-rate`
  - `method` equals `GET`
  - one of:
    - `Authorization` header starts with `Bearer `
    - `x-api-key` header exists

If Vercel asks which systems to bypass, bypass only Bot Protection / Security
Checkpoint / managed challenge mitigation for this rule.

Do not bypass the whole domain. Do not disable Bot Protection globally. Do not
place a Vercel automation bypass secret in the mobile wallet or any public client
bundle.



## CLI Shape

The Vercel CLI supports firewall rules, but it requires an authenticated Vercel
session or token and the correct project/scope.

```powershell
npx vercel firewall rules add "Bypass wallet public FX rate API" `
  --project fxadmin `
  --condition '{"type":"path","op":"eq","value":"/api/fx/public/current-rate"}' `
  --condition '{"type":"method","op":"eq","value":"GET"}' `
  --condition '{"type":"header","key":"authorization","op":"pre","value":"Bearer "}' `
  --or `
  --condition '{"type":"path","op":"eq","value":"/api/fx/public/current-rate"}' `
  --condition '{"type":"method","op":"eq","value":"GET"}' `
  --condition '{"type":"header","key":"x-api-key","op":"ex"}' `
  --action bypass `
  --yes

npx vercel firewall publish --project fxadmin --yes
```

If the project belongs to a team, add the correct `--scope <team-slug>`.

## Verification

After publishing the rule, run a header-only check with a valid generated
rate-read key:

```powershell
curl.exe -sS -D - -o NUL `
  -H "Authorization: Bearer <generated_rate_read_key>" `
  https://fxadmin.cignumsolutions.net/api/fx/public/current-rate
```

Expected success evidence:

```text
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 600
```

If the response still has `X-Vercel-Mitigated: challenge`, the Vercel firewall
rule has not matched the request or has not been published.
