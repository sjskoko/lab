CREATE TABLE page_views (
  minute TEXT NOT NULL,
  day TEXT NOT NULL,
  page TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0 CHECK(views BETWEEN 0 AND 600),
  PRIMARY KEY(minute,page)
);
CREATE INDEX page_views_day_page ON page_views(day,page);
