-- Migration script to add GEO (Generative Engine Optimization) fields to blog table
-- Run this script on your database to add the new fields

-- Add GEO fields to blog table
ALTER TABLE `blogs` 
ADD COLUMN `ai_summary` TEXT NULL COMMENT 'Short factual answer, ~1-2 sentences for AI extraction' AFTER `cover_image`,
ADD COLUMN `faq_section` JSON NULL COMMENT 'Array of question + answer pairs for FAQ schema' AFTER `ai_summary`,
ADD COLUMN `schema_type` ENUM('Article', 'FAQPage', 'Product', 'HowTo', 'BlogPosting', 'NewsArticle') NULL DEFAULT 'Article' COMMENT 'Schema.org type for structured data' AFTER `faq_section`,
ADD COLUMN `entities_keywords` JSON NULL COMMENT 'List of key concepts for AI extraction' AFTER `schema_type`;

-- Add indexes for better performance
CREATE INDEX `idx_blogs_schema_type` ON `blogs` (`schema_type`);
CREATE INDEX `idx_blogs_ai_summary` ON `blogs` (`ai_summary`(255));

-- Update existing records to have default schema_type
UPDATE `blogs` SET `schema_type` = 'Article' WHERE `schema_type` IS NULL;

-- Example of how to insert FAQ data (for reference)
-- UPDATE blogs SET faq_section = JSON_ARRAY(
--   JSON_OBJECT('question', 'What is this about?', 'answer', 'This is about...'),
--   JSON_OBJECT('question', 'How does it work?', 'answer', 'It works by...')
-- ) WHERE id = 1;

-- Example of how to insert entities/keywords data (for reference)
-- UPDATE blogs SET entities_keywords = JSON_ARRAY('keyword1', 'keyword2', 'keyword3') WHERE id = 1;
