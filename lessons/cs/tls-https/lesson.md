---
id: tls-https
title: What the padlock actually promises
slug: tls-https
kind: concept
track: cs
difficulty: core
estimated_minutes: 16
summary: TLS gives an encrypted, tamper-evident channel to a server whose certificate matches the name you asked for; it does not hide who you talk to, protect the endpoints, or decide what you are allowed to do.
tags:
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites:
  - http-and-tcp
related:
  - http-and-tcp
  - dns-resolution
  - authn-authz
  - web-security-basics
  - load-balancing
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc8446.html
  - https://www.rfc-editor.org/rfc/rfc5280.html
  - https://www.rfc-editor.org/rfc/rfc9525.html
  - https://www.rfc-editor.org/rfc/rfc6797.html
  - https://www.rfc-editor.org/rfc/rfc6962.html
  - https://www.rfc-editor.org/rfc/rfc8996.html
updated: 2026-10-28
status: canonical
---

# What the padlock actually promises

## Snapshot

- HTTPS is HTTP carried over TLS. TLS provides confidentiality, integrity, and authentication of the server (and optionally the client) for bytes in transit.
- In TLS 1.3, a full handshake takes one round trip before application data: both sides exchange ephemeral key shares, and the server proves it holds the private key for its certificate.
- The client accepts the server only if its certificate chains to a trusted root, is within its validity period, and names the host the client asked for.
- TLS does not hide IP addresses, traffic size and timing, or (without Encrypted Client Hello) the server name. It does nothing for data at rest or on a compromised endpoint.
- Where TLS ends matters: a load balancer that terminates TLS forwards plaintext unless the internal hop is encrypted too.

## Why it shows up in interviews

Design interviews ask where encryption happens and what it covers. Security-minded follow-ups probe whether you understand what a certificate proves, why a valid certificate on a lookalike domain is still a phishing site, and why "we use HTTPS" does not answer an authorization question. A clear account of the handshake and its limits is short and earns credibility.

## Core idea

### ELI5

Before talking, the browser and server each pick a secret random number and swap the public halves. From those, both compute the same key without ever sending it. The server also shows an ID card (its certificate), signed by an authority the browser already trusts, and signs the conversation so far to prove the card is really its own. After that, everything is encrypted and any tampering is detected.

[Follow a TLS 1.3 handshake](viz/handshake.md)

### The TLS 1.3 handshake, conceptually

1. **ClientHello.** Supported versions and cipher suites, a key share for an ephemeral Diffie-Hellman exchange, and usually the server name (SNI).
2. **ServerHello.** The server picks parameters and returns its key share. Both sides now derive handshake keys.
3. **Server's encrypted flight.** The certificate chain, a **CertificateVerify** signature over the handshake transcript made with the certificate's private key, and **Finished**, a MAC over the transcript.
4. **Client checks and finishes.** It validates the chain, the name, and the signature, then sends its own Finished. Application data flows.

Because key shares are ephemeral, recording traffic today and stealing the server's long-term key later does not decrypt past sessions (forward secrecy). Session resumption skips some work; **0-RTT** early data on resumption saves a round trip but can be replayed by an attacker, so it should carry only requests that are safe to repeat.

TLS 1.2 is still widely deployed and takes an extra round trip in its common form. TLS 1.0 and 1.1 are deprecated (RFC 8996).

### What a certificate proves

A certificate binds a public key to names (in the Subject Alternative Name extension) and is signed by a certificate authority (CA). The client builds a chain from the server's certificate through intermediates to a root in its trust store and checks:

- every signature in the chain,
- validity dates,
- that the requested hostname matches a SAN entry. A wildcard such as `*.shop.example` matches exactly one leftmost label: `cart.shop.example`, not `shop.example` or `a.b.shop.example`,
- revocation status where the client checks it (CRLs, OCSP). In practice revocation checking is inconsistent across clients, which is one reason short certificate lifetimes are common.

**Certificate Transparency** logs make issued certificates public, so a domain owner can detect a certificate it did not request. A certificate proves control of a domain name at issuance. It does not prove the site is honest, and `shop-examp1e.com` can have a perfectly valid certificate.

### What TLS protects and what it does not

| Protected | Not protected |
| --- | --- |
| Contents of requests and responses in transit | Data at rest on the server or client |
| Integrity: tampering is detected | A compromised endpoint, browser extension, or server |
| Server identity matching the requested name | Whether that server is trustworthy or the name is the one the user meant |
| Optionally client identity (mutual TLS) | Application authorization: which user may do what |
| Past sessions after key theft (forward secrecy) | IP addresses, traffic size and timing; SNI unless ECH is used; DNS queries unless DNS is encrypted separately |

**HSTS** (`Strict-Transport-Security`) tells a browser to use HTTPS only for a host from now on, which closes the "first plain HTTP request gets redirected by an attacker" gap after the first visit, or from the start if the host is on a preload list.

## Worked example

A store runs `shop.example` behind a load balancer, with an API at `api.shop.example`.

### Easy

The browser connects to `api.shop.example`. The certificate's SANs are `shop.example` and `*.shop.example`. The wildcard covers `api.shop.example` (one label). The chain ends at a trusted root and the dates are valid, so the handshake succeeds.

### Medium

A developer adds `eu.api.shop.example`. The wildcard does not match two labels, so clients reject it. Options: add `eu.api.shop.example` or `*.api.shop.example` to the certificate. The sketch below implements the matching rule.

### Hard

The load balancer terminates TLS and forwards plain HTTP to the API servers inside the network. Payment data now crosses the internal network unencrypted, and anyone with access to that segment can read it. Either re-encrypt from the load balancer to the servers (possibly with mutual TLS so servers accept only the balancer) or justify why the internal segment is trusted, and say who holds the private keys at each hop.

```ts
function hostMatches(host: string, san: string): boolean {
  const h = host.toLowerCase().split("."), p = san.toLowerCase().split(".");
  if (h.length !== p.length) return false;          // wildcard covers exactly one label
  return p.every((label, i) => (i === 0 && label === "*") ? h[0].length > 0 : label === h[i]);
}

function certCovers(host: string, sans: string[]): boolean {
  return sans.some((san) => hostMatches(host, san));
}

const sans = ["shop.example", "*.shop.example"];
console.log(certCovers("api.shop.example", sans));    // true
console.log(certCovers("shop.example", sans));        // true, via the exact entry
console.log(certCovers("eu.api.shop.example", sans)); // false: two labels
console.log(certCovers("shop.example.evil", sans));   // false
```

This shows only the name rule. Real validation also checks the chain, signatures, dates, key usage, and revocation, and should come from a maintained TLS library.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "HTTPS means the site is safe" | Users trust a valid cert on a lookalike domain | A cert proves name control, not honesty |
| Disabling certificate verification to fix an error | Any attacker on the path can impersonate the server | Fix the chain or name; never ship verify-off |
| Terminating TLS and forgetting the next hop | Plaintext inside the network | Re-encrypt or justify the trust boundary |
| Wildcard expected to cover the apex or deeper names | Handshake fails for `shop.example` or `a.b.shop.example` | List each needed name or level |
| Sending non-idempotent requests as 0-RTT data | Replayed purchases | Restrict early data to safe requests |
| Treating TLS as authorization | Any authenticated channel can call any endpoint | Authorize per request at the application |

## How to talk about it

"Clients use TLS 1.3 to the edge with HSTS. The certificate covers the apex and one wildcard level; anything deeper gets its own SAN. The load balancer terminates TLS and re-encrypts to the services with mutual TLS so only the balancer can call them. TLS protects the bytes in transit; who may call which endpoint is still checked by the API on every request."

## Cross-links

- [HTTP is a conversation, TCP is the pipe](../http-and-tcp.md) (id: http-and-tcp)
- [A name is not an address](../dns-resolution/lesson.md) (id: dns-resolution)
- [Who you are versus what you may do](../../system-design/foundations/authn-authz/lesson.md) (id: authn-authz)
- [Cookies, scripts, and cross-site requests](../web-security-basics.md) (id: web-security-basics)
- [Spreading work without creating a new bottleneck](../../system-design/foundations/load-balancing.md) (id: load-balancing)
