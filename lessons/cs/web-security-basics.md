---
id: web-security-basics
title: Cookies, scripts, and cross-site requests
slug: web-security-basics
kind: concept
track: cs
difficulty: core
estimated_minutes: 18
summary: XSS runs an attacker's script inside your page, CSRF makes the browser send your cookies on an attacker's request, CORS controls who may read your responses, and SameSite controls when cookies travel.
tags:
  - cs
  - cs/networking
  - interviews
  - interviews/frontend
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - authn-authz
  - tls-https
  - http-and-tcp
  - encoding-unicode
company_signal: []
sources_consulted:
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - https://fetch.spec.whatwg.org/#http-cors-protocol
  - https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html
  - https://www.w3.org/TR/CSP3/
updated: 2026-10-28
status: canonical
---

# Cookies, scripts, and cross-site requests

## Snapshot

- **XSS (cross-site scripting):** attacker-controlled text is interpreted as code in your page and runs with your users' privileges. Fix by encoding output for its context; add a Content Security Policy as defense in depth.
- **CSRF (cross-site request forgery):** another site causes the browser to send a request to yours, and the browser attaches your cookies. Fix with SameSite cookies, CSRF tokens, and Origin checks, and never change state on GET.
- **CORS (cross-origin resource sharing)** relaxes the browser's same-origin policy so a page on one origin can *read* responses from another. It does not stop requests from being sent, and it is not server-side access control.
- **SameSite** (`Strict`, `Lax`, `None`) decides whether a cookie is sent on cross-site requests. `None` requires `Secure`.
- "Site" (scheme plus registrable domain, such as `https://tickets.example`) is broader than "origin" (scheme, host, and port). Subdomains are same-site.

## Why it shows up in interviews

Frontend and full-stack loops ask about these directly, and system design rounds hit them whenever a browser talks to an API with cookies. The usual mistakes are mixing up CORS and CSRF, believing CORS protects the server, and escaping input once on the way in instead of encoding output for where it lands. Being precise about which browser rule stops which attack is the signal.

## Core idea

### ELI5

The browser keeps each website in its own box and attaches that website's cookies to any request headed there, no matter which page asked. **XSS** is an attacker sneaking a note inside your box that the browser then obeys as if you wrote it. **CSRF** is an attacker's page telling the browser "go post this to the ticket site," and the browser helpfully brings your ticket-site cookies along. **SameSite** tells the browser to leave some cookies at home when the request came from another site. **CORS** is your server telling the browser which other sites may read its replies.

### XSS

- **Stored:** a ticket comment containing `<img src=x onerror=...>` is saved and rendered for every viewer.
- **Reflected:** a search page echoes `?q=` into HTML.
- **DOM-based:** client code writes untrusted data with `innerHTML` or similar.

Encode on output, for the context: HTML text, HTML attribute, URL, JavaScript, and CSS each need different handling. Frameworks that escape by default help until someone uses the raw-HTML escape hatch. If rich text is required, sanitize with a maintained allowlist sanitizer. A Content Security Policy that forbids inline scripts and limits script sources makes many injections fail. `HttpOnly` cookies stop script from reading the session cookie, but injected script can still make requests as the user.

### CSRF

A cross-site form post or image request to `tickets.example/tickets/31/close` carries the user's cookies unless something prevents it. Defenses, usually combined:

- Session cookie with `SameSite=Lax` or `Strict`.
- A CSRF token: a value tied to the session that the attacker cannot read, required on state-changing requests.
- Checking the `Origin` (or `Sec-Fetch-Site`) header on state-changing requests.
- No state changes on GET. `Lax` cookies are still sent on top-level GET navigations from other sites.

APIs that authenticate with an `Authorization` header instead of cookies are not exposed to classic CSRF, because the browser does not attach that header automatically.

### SameSite

| Value | Sent on cross-site requests? | Notes |
| --- | --- | --- |
| `Strict` | Never | Users following a link from email arrive logged out |
| `Lax` | Only top-level navigations with safe methods (GET) | Blocks cross-site POST, iframes, and subresource requests |
| `None` | Always (if the browser permits third-party cookies) | Must be `Secure` or the browser rejects the cookie |
| Not set | Browser-dependent | Chromium-based browsers treat it as `Lax`; do not rely on defaults |

Because subdomains are same-site, SameSite does not protect `app.tickets.example` from a page on `uploads.tickets.example`. Host user-uploaded content on a separate registrable domain.

### CORS

By default, script on `https://app.tickets.example` can send a request to `https://api.tickets.example` but cannot read the response, because they are different origins. The API opts in with `Access-Control-Allow-Origin: https://app.tickets.example`. For requests with cookies, it must name the exact origin (not `*`) and send `Access-Control-Allow-Credentials: true`. Methods other than GET/HEAD/POST, custom headers, or a JSON content type trigger a **preflight** `OPTIONS` request first.

CORS is enforced by browsers for browser scripts. `curl` ignores it. A server that reflects any `Origin` back with credentials allowed lets every website read logged-in users' data.

## Worked example

A ticket tracker at `app.tickets.example`, API at `api.tickets.example`, session in a cookie. An attacker runs `evil.example`.

### Easy

A comment body is `<script>fetch('/api/me')</script>`. Rendered with HTML escaping, it shows as literal text. The sketch's `escapeHtml` produces `&lt;script&gt;…`.

### Medium

`evil.example` hosts an auto-submitting form that POSTs to `api.tickets.example/tickets/31/close`. The session cookie is `SameSite=Lax`, so it is not sent on that cross-site POST and the request arrives unauthenticated. If the close action also worked via GET, a top-level link would carry the `Lax` cookie and succeed, which is why state changes do not belong on GET.

### Hard

The API returns `Access-Control-Allow-Origin` equal to whatever `Origin` it receives, plus `Allow-Credentials: true`. A logged-in user visits `evil.example`, whose script calls `api.tickets.example/me` with `credentials: "include"`. Is the cookie sent? With `SameSite=Lax`, no: this is a cross-site subresource request. With `SameSite=None; Secure`, yes, and the reflected CORS headers let the attacker read the response. Fix the CORS rule to an allowlist regardless of cookie settings.

```ts
function escapeHtml(s: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

type Req = { crossSite: boolean; topLevel: boolean; method: string };
function cookieSent(sameSite: "Strict" | "Lax" | "None", secure: boolean, r: Req): boolean {
  if (sameSite === "None" && !secure) return false; // browser rejects the cookie
  if (!r.crossSite) return true;
  if (sameSite === "Strict") return false;
  if (sameSite === "Lax") return r.topLevel && ["GET", "HEAD"].includes(r.method);
  return true; // None: subject to the browser's third-party cookie policy
}

function corsAllowOrigin(origin: string, allow: string[]): string | null {
  return allow.includes(origin) ? origin : null; // never reflect blindly
}

console.log(escapeHtml("<script>fetch('/api/me')</script>"));
console.log(cookieSent("Lax", true, { crossSite: true, topLevel: false, method: "POST" })); // false: forged form
console.log(cookieSent("Lax", true, { crossSite: true, topLevel: true, method: "GET" }));   // true: link click
console.log(cookieSent("None", true, { crossSite: true, topLevel: false, method: "GET" })); // true
console.log(corsAllowOrigin("https://evil.example", ["https://app.tickets.example"]));      // null
```

The cookie function is a simplified model of current browser behavior, which varies by browser and version, including third-party cookie restrictions.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "CORS protects our API" | Non-browser clients and simple requests still reach it | Authenticate and authorize on the server |
| Reflecting any `Origin` with credentials | Any site reads logged-in users' data | Exact allowlist |
| Escaping input once at write time | Wrong encoding for some contexts; double escaping | Encode on output for each context |
| `HttpOnly` as the XSS fix | Script still acts as the user | Prevent injection; CSP as backup |
| State change on GET | CSRF through links and `Lax` cookies | POST/PUT/DELETE with CSRF defenses |
| `SameSite=None` without `Secure` | Browser drops the cookie | Always pair them |
| Same-site assumed to mean same-origin | Sibling subdomain attacks | Separate registrable domain for untrusted content |

## How to talk about it

"Templates escape by default and rich-text comments go through a sanitizer; a CSP blocks inline scripts as a backstop. The session cookie is `HttpOnly; Secure; SameSite=Lax`, state changes are never GET, and state-changing requests also check `Origin`. The API's CORS policy names the app origin exactly with credentials. Uploads are served from a different registrable domain so they are cross-site to the app."

## Cross-links

- [Who you are versus what you may do](../system-design/foundations/authn-authz/lesson.md) (id: authn-authz)
- [What the padlock actually promises](./tls-https/lesson.md) (id: tls-https)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [Bytes are not characters](./encoding-unicode.md) (id: encoding-unicode)
