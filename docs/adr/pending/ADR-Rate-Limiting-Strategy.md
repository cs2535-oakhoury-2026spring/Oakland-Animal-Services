# ADR: Rate Limiting Strategy

## Context

Without rate limiting, a single user (or malicious actor) could:
- Overwhelm the API with requests, causing denial-of-service for other users
- Abuse expensive operations (OpenAI API calls for summarization) costing thousands in API fees
- Brute-force passwords or tokens


## Decision

Implement two-tier rate limiting:

**General Rate Limit:** 300 requests/minute per user or IP
- Applies to all endpoints
- Exception: DELETE requests are not rate-limited (allows bulk deletion operations)
- Prevents accidental DoS and brute-force attacks

**Summarization Rate Limit:** 6 requests/minute per user or IP
- Stricter limit for `POST /api/pets/:petId/behavior-notes/summarize`
- Notes take along time to process and are expensive and 10 seconds for every request is a fair amount of time for staff to wait for a summary.

Rate limits return **HTTP 429** (Too Many Requests) with retry-after header.

## Consequences

### Benefits

1. **Cost control** — Prevents runaway API bills from OpenAI or other expensive services
2. **Availability** — Prevents single user from overwhelming the API and degrading experience for others
3. **Security** — Makes brute-force attacks impractical

### Drawbacks

1. **User friction** — Legitimate bulk operations (bulk note creation) may hit rate limit; requires workarounds or patience
2. **Complexity** — Rate limiting adds code, state management, and operational complexity
3. **False positives** — Legitimate operations (mobile app with poor network retrying) may be throttled unfairly
