-- Before the article-only reader tracking guard existed, generic pages could
-- emit article progress events without an associated article. They cannot
-- represent a completed article or an active article reading session.
DELETE FROM `audience_events`
WHERE `article_slug` IS NULL
  AND `event_name` IN (
    'active_read_30_seconds',
    'article_25_percent',
    'article_50_percent',
    'article_75_percent',
    'article_90_percent'
  );
