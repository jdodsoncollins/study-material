---
id: http-and-tcp
title: HTTP is a conversation, TCP is the pipe
slug: http-and-tcp
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: TCP delivers a reliable byte stream; HTTP is a request/response language on top of that stream (or on QUIC instead).
tags:
  - cs
  - cs/networking
  - interviews
  - interviews/system-design
prerequisites: []
related:
  - processes-threads
  - encoding-unicode
  - caching
  - cap-and-consistency
  - dns-resolution
  - file-download
company_signal: []
sources_consulted:
  - https://www.rfc-editor.org/rfc/rfc9110.html
  - https://www.rfc-editor.org/rfc/rfc9112.html#section-9.3
  - https://www.rfc-editor.org/rfc/rfc9000.html
  - https://www.rfc-editor.org/rfc/rfc8441.html
  - https://www.rfc-editor.org/rfc/rfc9220.html
updated: 2026-10-26
status: canonical
---

# HTTP is a conversation, TCP is the pipe

## Snapshot

- TCP transports an ordered byte stream. It does not define HTTP request boundaries or retry application operations.
- HTTP defines request and response semantics: methods, fields, status codes, and content.
- HTTP/1.1 normally uses persistent TCP connections. HTTP/2 multiplexes streams over TCP; HTTP/3 uses QUIC over UDP.
- HTTPS adds transport security. Use it for public APIs; plain HTTP still exists and is not encrypted.

## Why it shows up in interviews

An API design needs a transport, a security boundary, and a failure policy. These are separate decisions. In particular, a connection failure cannot tell you whether the server committed an operation before the response disappeared.

## Core idea

### ELI5

TCP delivers bytes in order, like assembling numbered pages. HTTP supplies the meaning of those pages. A request can span many TCP segments, and a persistent connection can carry many requests.

For a new HTTPS connection using TCP, the simplified sequence is DNS lookup if needed, TCP handshake, TLS handshake, then HTTP messages. Cached connections and protocol versions change the work involved.

HTTP/2 streams share TCP's ordered delivery, so lost bytes can delay otherwise independent streams. QUIC gives streams independent ordering. It reduces that cross-stream transport blockage, but streams still share connection resources and congestion control.

## Comparison

| Layer or protocol | Provides | Does not establish |
| --- | --- | --- |
| UDP | Datagram delivery interface | Reliable or ordered delivery |
| TCP | Reliable ordered byte stream while the connection works | Whether an application transaction committed |
| TLS | Encryption, integrity, and peer authentication | Application authorization |
| HTTP | Methods, status codes, fields, and content semantics | Automatic exactly-once execution |
| QUIC | Secure transport with independently ordered streams | Immunity to loss, congestion, or timeouts |

### Easy

A GET receives 400 because its parameters are invalid. Repeating the same request is unlikely to help, even though GET is idempotent. Retry policy needs both operation semantics and a reason to expect a transient failure.

### Medium

A POST creates an order, then its response is lost. Replaying it can create a duplicate. A server-supported idempotency key can associate retries with the same operation. Sending an arbitrary header does not create that guarantee by itself.

```ts
function shouldRetry(method: string, status: number, replayProtected = false): boolean {
  const idempotent = new Set(["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]);
  const transient = new Set([429, 500, 502, 503, 504]);
  return transient.has(status) && (idempotent.has(method.toUpperCase()) || replayProtected);
}
console.log(shouldRetry("GET", 400), shouldRetry("GET", 503)); // false true
console.log(shouldRetry("PATCH", 503), shouldRetry("POST", 503, true)); // false true
console.log(shouldRetry("POST", 409, true)); // false: inspect the conflict
```

This is an illustrative status policy, not a retry loop. A production policy also bounds attempts and total time, honors applicable `Retry-After`, uses backoff with jitter, and ensures the request body can be replayed. Some APIs narrow the transient status list further. Network timeouts have no HTTP status and need their own decision using the same replay-safety rules.

### Hard

Safe methods request no state change. Idempotent methods have the same intended effect when repeated, although their responses can differ. Cacheability is another property: HTTP permits some POST responses to be cached under explicit conditions, though common caches mainly support GET and HEAD.

**Try it:** DELETE succeeds, but the retry returns 404. Has idempotency failed? Not necessarily: the resource is absent after either request. Interpret the response using the endpoint contract rather than requiring identical status codes.

## Common mistakes

- Treating a timeout as evidence that nothing happened. Reconcile the operation or use a defined replay mechanism.
- Retrying every GET response, or treating every non-POST method as safe to replay.
- Treating 409 as successful replay without checking the API contract.
- Assuming every HTTP/1.1 request needs a new handshake. Persistent connections are the default unless closed.
- Describing all WebSockets as an HTTP Upgrade. HTTP/1.1 uses Upgrade; HTTP/2 and HTTP/3 use extended CONNECT mechanisms.

## How to talk about it

“I will separate connection recovery from operation recovery. For reads, I can retry transient failures within a budget. For writes, I need idempotent semantics or a server-supported replay key, and a way to resolve an unknown outcome.”

## Cross-links

- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Bytes are not characters](./encoding-unicode.md) (id: encoding-unicode)
- [Remembering the expensive answer nearby](../system-design/foundations/caching/lesson.md) (id: caching)
- [Consistency promises during failures](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
- [A name is not an address](./dns-resolution/lesson.md) (id: dns-resolution)
- [A download is bytes plus a name](./file-download.md) (id: file-download)
