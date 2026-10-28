---
id: authn-authz
title: Who you are versus what you may do
slug: authn-authz
kind: concept
track: system-design
difficulty: core
estimated_minutes: 18
summary: Authentication establishes identity, authorization decides access; compare server sessions with self-contained tokens, place OAuth 2.0 and OpenID Connect roles correctly, and choose RBAC or ABAC from the shape of your rules.
tags:
  - system-design
  - system-design/foundations
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - web-security-basics
  - tls-https
  - desk-bot
  - feature-flags
  - tool-calling
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc6749.html
  - https://www.rfc-editor.org/rfc/rfc7636.html
  - https://www.rfc-editor.org/rfc/rfc9700.html
  - https://openid.net/specs/openid-connect-core-1_0.html
  - https://www.rfc-editor.org/rfc/rfc7519.html
  - https://doi.org/10.6028/NIST.SP.800-162
updated: 2026-10-28
status: canonical
---

# Who you are versus what you may do

## Snapshot

- **Authentication (authn)** answers "who is this?" **Authorization (authz)** answers "may they do this to that?" Keep them separate in the design and in the code.
- A **session** is a random ID mapped to state on the server: easy to revoke, needs a lookup. A **self-contained token** (often a signed JWT) carries claims: no lookup, but revocation before expiry needs extra machinery.
- **OAuth 2.0** is a framework for delegated authorization: a client gets an access token to call an API on a user's behalf. It does not by itself say who the user is.
- **OpenID Connect (OIDC)** adds authentication on top of OAuth 2.0 with an ID token for the client.
- **RBAC** grants permissions through roles. **ABAC** evaluates attributes of the user, resource, action, and context. Most real systems mix them.

## Why it shows up in interviews

Every multi-user design has a moment where the interviewer asks "how does the API know this user may edit this document?" or "how do you log someone out everywhere?" Mixing up OAuth and login, or putting the authorization check only in the UI, are common and visible mistakes. A clean answer names the identity provider, the token the API sees, where authorization is enforced, and how access is revoked.

## Core idea

### ELI5

Authentication is checking an ID card at the door. Authorization is the list that says which rooms that person may enter. A session is a coat-check ticket: the venue keeps the record, and tearing it up ends your visit. A signed token is a wristband: anyone can read it without calling the front desk, but it stays valid until it expires unless every door also checks a ban list.

### Sessions versus tokens

| Property | Server session (opaque ID in a cookie) | Self-contained token (e.g. signed JWT) |
| --- | --- | --- |
| Validation | Look up the ID in a session store | Verify signature, issuer, audience, expiry locally |
| Revocation | Delete the session row | Wait for expiry, or keep a deny list / check status |
| Size | Small cookie | Larger; grows with claims |
| Fit | First-party web apps | APIs called by many services; short-lived access tokens |

A common hybrid: short-lived access tokens (minutes) plus a longer-lived refresh token that the authorization server can revoke. A JWT is signed, not encrypted, unless you use encryption explicitly, so do not put secrets in its claims.

### OAuth 2.0 and OIDC roles

- **Resource owner:** the user who owns the data.
- **Client:** the app that wants access (a web app, mobile app, or another service).
- **Authorization server:** authenticates the user, gets consent, and issues tokens.
- **Resource server:** the API that accepts access tokens and enforces scopes and its own rules.

For user-facing apps, the **authorization code flow with PKCE** is the current recommended pattern (RFC 9700, the OAuth 2.0 security best current practice): the client redirects the user to the authorization server, gets back a one-time code, and exchanges it, with a PKCE verifier, for tokens. The implicit flow is discouraged. Machine-to-machine calls use the client credentials grant.

[Follow the authorization code flow](viz/code-flow.md)

With OIDC, the client also receives an **ID token** describing the authenticated user, meant for the client. The **access token** is meant for the resource server. An API should not accept an ID token as an access token, and a client should not treat possession of an access token as proof of who the user is.

### Where authorization lives

Enforce on the server, at the resource, on every request. Scopes in a token say what the client was allowed to ask for ("read calendar"); they do not replace the resource server's check that this user can read *this* calendar. Hiding a button in the UI is not authorization.

### RBAC and ABAC

**RBAC:** users get roles (`viewer`, `editor`, `owner`), roles get permissions. Easy to audit and explain. Struggles when rules depend on context ("editors may edit only documents in their own team, and not after they are locked").

**ABAC:** a policy evaluates attributes: `user.team == doc.team && !doc.locked && action == "edit"`. Expressive and fine-grained. Harder to audit ("who can edit this?") and needs every attribute to be available and trustworthy at decision time. NIST SP 800-162 describes the model.

Many systems use roles for the coarse grant and attribute conditions for the exceptions. Relationship-based models (permissions derived from a graph of shares, folders, and groups) are another option for document-sharing products.

## Worked example

A team document editor. Users have roles per workspace. Documents have a team and a locked flag.

### Easy

Ana is an `editor` in workspace 7. RBAC says editors may `edit`. She edits document 31 in workspace 7: allowed.

### Medium

Document 31 is locked for legal review. RBAC alone still says yes. Add an ABAC condition: edits require `!doc.locked` unless the user is an `owner`. Ana is denied; the workspace owner is allowed.

### Hard

Ana's access token was issued 4 minutes ago with a 15-minute lifetime and includes `role: editor`. An admin removes her from the workspace. If the API trusts the role claim in the token, Ana can keep editing for 11 more minutes. Options: look up current membership at the resource server on each write (fresh, costs a lookup), shorten token lifetime, or check a revocation list. For a document editor, looking up membership on writes is usually the right default.

```ts
type User = { id: string; roles: Record<number, "viewer" | "editor" | "owner"> };
type Doc = { id: number; workspace: number; locked: boolean };

const rank = { viewer: 1, editor: 2, owner: 3 } as const;

function canEdit(user: User, doc: Doc): boolean {
  const role = user.roles[doc.workspace];
  if (!role || rank[role] < rank.editor) return false; // RBAC: need editor or above
  if (doc.locked && role !== "owner") return false;    // ABAC: lock condition
  return true;
}

const ana: User = { id: "ana", roles: { 7: "editor" } };
const owner: User = { id: "kofi", roles: { 7: "owner" } };
console.log(canEdit(ana, { id: 31, workspace: 7, locked: false }));   // true
console.log(canEdit(ana, { id: 31, workspace: 7, locked: true }));    // false
console.log(canEdit(owner, { id: 31, workspace: 7, locked: true }));  // true
console.log(canEdit(ana, { id: 40, workspace: 9, locked: false }));   // false: no role there
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "We use OAuth for login" with no OIDC | Identity is inferred from an access token | Use OIDC's ID token for authentication |
| API accepts ID tokens | Tokens meant for the client unlock the API | Validate audience; require access tokens |
| Long-lived JWT with roles baked in | Revoked users keep access until expiry | Short lifetimes plus server-side checks for sensitive actions |
| Authorization only in the UI | Direct API calls bypass it | Enforce at the resource server on every request |
| Scopes treated as per-object permission | Any user's data readable with the right scope | Scope limits the client; resource checks limit the user |
| Secrets inside JWT claims | Anyone holding the token can read them | Signed is not encrypted; keep secrets out |

## How to talk about it

"Users sign in with OIDC through our identity provider using the code flow with PKCE. The web app keeps a server session; mobile clients get 10-minute access tokens and a revocable refresh token. The document API validates the access token's issuer and audience, then checks workspace membership and role from our own store on every write, plus a lock condition. That combination keeps revocation fast where it matters."

## Cross-links

- [Cookies, scripts, and cross-site requests](../../../cs/web-security-basics.md) (id: web-security-basics)
- [What the padlock actually promises](../../../cs/tls-https/lesson.md) (id: tls-https)
- [Build a chat assistant with durable jobs and authorized tools](../../../ai-agents/desk-bot/lesson.md) (id: desk-bot)
- [Distribute versioned feature decisions](../../cases/feature-flags.md) (id: feature-flags)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
