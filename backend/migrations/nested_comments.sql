-- Migration: add parent_comment_id to support nested replies
ALTER TABLE comments ADD COLUMN parent_comment_id INTEGER DEFAULT NULL;
