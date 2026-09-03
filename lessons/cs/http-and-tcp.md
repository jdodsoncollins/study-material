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
  - interviews/system-design
prerequisites: []
related:
  - processes-threads
  - encoding-unicode
  - caching
  - cap-and-consistency
company_signal:
  - name: Amazon
    evidence: API-design and service-design screens still ask what lives on TCP vs HTTP, idempotency of methods, and why a retry doubled a charge.
    year: 2026
    confidence: high
sources_consulted:
  - TCP handshake / stream reliability as taught in networks courses
  - HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3-over-QUIC summaries
  - Idempotency and status-code talk in backend interview threads
updated: 2026-09-02
status: canonical
---

# HTTP is a conversation, TCP is the pipe

## Snapshot

- **TCP** is a 5-tuple connection (src IP/port, dst IP/port, protocol) that offers a reliable, ordered *byte stream*. It does not know what a request is.
- **HTTP** is the application language: method, path, headers, body, status. It needs a transport.
- HTTP/1.1 usually rides TCP with optional keepalive. HTTP/2 multiplexes many streams on one TCP connection. HTTP/3 rides **QUIC** (UDP) instead.
- TLS encrypts the pipe. It is not HTTP, and it is not optional on the public web.

## Why it shows up in interviews

System design prompts assume you can place a load balancer, explain why a client retried, and not say "we send a packet of HTTP." They also want GET vs POST discipline: retries, caches, and "did we charge twice."

A 90-second pass: TCP handshake and reliability, HTTP as messages, status codes that change retries, where TLS sits.

## Core idea

Mail analogy: TCP is numbered, acknowledged postcards that reconstruct a novel in order. HTTP is the novel's chapter format — "GET /menus/42" is a sentence, not a postcard.

```
client  --SYN-->  server
        <--SYN-ACK--
        --ACK-->          TCP up
        --TLS handshake--
        --HTTP request-->
        <--HTTP response--
```

TCP retransmits lost bytes. It does **not** retry your POST. If the response is lost after the server charged the card, a naive client retry is a second charge. That is why idempotency keys live in HTTP, not in TCP.

Head-of-line blocking: HTTP/1.1 pipelines poorly; one lost TCP packet stalls every HTTP/2 stream on that connection. HTTP/3/QUIC avoids that by not being TCP.

## Comparison

| Layer | Job | Interview phrase |
| --- | --- | --- |
| UDP | Datagrams, no retry | "I will invent reliability if I need it" |
| TCP | Reliable ordered bytes | "Connection, handshake, stream" |
| TLS | Encryption + auth of the pipe | "Terminated at the LB or the app" |
| HTTP | Methods, headers, status, body | "The API contract" |
| QUIC / HTTP/3 | Multiplexed, over UDP | "Avoid TCP HOL blocking" |

```ts
type ChargeReq = { orderId: string; cents: number; idempotencyKey: string };

function methodRetryable(method: string, status: number): boolean {
  if (method === "GET" || method === "HEAD") return true;
  // 409/200 on a replayed POST should be treated as success by key, not retried blindly
  return status >= 500 && method !== "POST";
}
```

GET is expected idempotent and cacheable. POST is neither unless you *make* it so with a key.

## Common mistakes

- "HTTP is a TCP packet." HTTP messages may span many TCP segments, or many streams.
- Retrying POST on timeout. Timeout ≠ the server did not commit.
- Using 200 for "created" and 500 for "client sent junk." Status is a contract: 4xx your bug, 5xx mine, 429 back off.
- Forgetting Connection: keep-alive vs one handshake per request. Handshake + TLS dwarf a 200-byte JSON body.

## How to talk about it

"TCP gives me a reliable byte pipe after a three-way handshake. HTTP is the request/response contract I put on that pipe. I will not retry a POST on timeout without an idempotency key. I terminate TLS at the load balancer unless I have a reason not to. If they ask HTTP/2 vs 3, I mention multiplexing and TCP head-of-line."

If they ask WebSockets: "That's an HTTP upgrade, then a long-lived bidirectional TCP (or QUIC) stream. Different conversation rules, same pipe."

## Cross-links

- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Bytes are not characters](./encoding-unicode.md) (id: encoding-unicode)
- [Cache as a second store](../system-design/foundations/caching/lesson.md) (id: caching)
- [CAP as a conversation tool](../system-design/foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
