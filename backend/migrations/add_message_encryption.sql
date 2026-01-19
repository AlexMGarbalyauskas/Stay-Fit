-- Migration to add end-to-end encryption support for messages
-- Adds encrypted_content and encryption metadata fields

-- Add columns for encrypted messages
ALTER TABLE messages ADD COLUMN encrypted_content TEXT;
ALTER TABLE messages ADD COLUMN iv TEXT;
ALTER TABLE messages ADD COLUMN is_encrypted INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_encrypted ON messages(is_encrypted);
