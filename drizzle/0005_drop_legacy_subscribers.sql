-- Phase 2: run only after the application backfill verification reports zero
-- missing ciphertext/blind-index rows and matching legacy/new counts.
DROP TABLE `subscribers_legacy_0004`;
