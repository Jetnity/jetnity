# Viator S2 native activities — SELF REVIEW

28 October 2026. Author review only. Not an independent Technical Lead PASS.

The session is still `bc-803fd88c-9fdc-47f7-acfc-213976e487f6`, model `grok-4.7-high-fast`. The S2 task file from `ce9210cf` was fast-forwarded and not edited. Main `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` was merged without force. The exact head is the commit that contains this review; the STOP comment records its SHA.

## Holds

- The runtime search calls `GET /destinations`, caches it for at most 3600 seconds, and resolves Bangkok and Chiang Mai in Thailand separately from Paris in France and Paris in the United States. A bare Paris name stays ambiguous. A second search reuses the catalog.
- Changing the date aborts the previous live check. A late response of 111 does not replace the cleared quote. The next check can show 80.
- A sold-out 10:00 time is omitted. Detail rate limiting stays `rate_limited`, not a generic error.
- An unmapped place does not call search and does not guess Bangkok or any other city.
- A CHF request does not relabel a EUR price. The activity option does not carry the product URL.
- A participant total does not become a live check.
- Search content is `rrp_from`, not a current quote. The schedule panel says it is not current availability.
- Browser evidence used Playwright and a root font size of 32px, not browser zoom. Widths 320, 390, 768, and 1440 stayed within the viewport. The harness passes data as a prop; the routes do not.

## Gaps

Live Sandbox is BLOCKED. The destination list is empty, so enabling a key later still does not search until bindings exist. Image license is not verified. Checkout transfer is not proven. DiscoverCars was not implemented here because #1059 owns those files. Previous CI 40686110218 does not cover this head.

Stop. No Ready. No merge. No follow-up slice.
