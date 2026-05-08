-- Migration to support soft-delete for messages
-- Instead of permanently deleting messages, mark them as deleted

ALTER TABLE messages ADD COLUMN is_deleted INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted);
