-- Migration script to add GEO (Generative Engine Optimization) fields to SEO table
-- Run this script on your database to add the new fields for multiple page access

-- Add GEO fields to SEO table
ALTER TABLE `seos` 
ADD COLUMN `ai_summary` TEXT NULL COMMENT 'Short factual answer, ~1-2 sentences for AI extraction' AFTER `json_ld`,
ADD COLUMN `faq_section` JSON NULL COMMENT 'Array of question + answer pairs for FAQ schema' AFTER `ai_summary`,
ADD COLUMN `schema_type` ENUM('Article', 'FAQPage', 'Product', 'HowTo', 'BlogPosting', 'NewsArticle', 'WebPage', 'Organization', 'LocalBusiness') NULL DEFAULT 'WebPage' COMMENT 'Schema.org type for structured data' AFTER `faq_section`,
ADD COLUMN `entities_keywords` JSON NULL COMMENT 'List of key concepts for AI extraction' AFTER `schema_type`,
ADD COLUMN `page_type` ENUM('home', 'about', 'contact', 'services', 'products', 'blog', 'category', 'custom') NULL DEFAULT 'custom' COMMENT 'Type of page for better categorization' AFTER `entities_keywords`;

-- Add indexes for better performance
CREATE INDEX `idx_seos_page_type` ON `seos` (`page_type`);
CREATE INDEX `idx_seos_schema_type` ON `seos` (`schema_type`);
CREATE INDEX `idx_seos_ai_summary` ON `seos` (`ai_summary`(255));

-- Update existing records to have default values
UPDATE `seos` SET `schema_type` = 'WebPage' WHERE `schema_type` IS NULL;
UPDATE `seos` SET `page_type` = 'custom' WHERE `page_type` IS NULL;

-- Example of how to insert FAQ data for SEO entries (for reference)
-- UPDATE seos SET faq_section = JSON_ARRAY(
--   JSON_OBJECT('question', 'What services do you offer?', 'answer', 'We offer comprehensive prefab construction solutions...'),
--   JSON_OBJECT('question', 'How can I contact you?', 'answer', 'You can contact us through our contact form or call us directly...')
-- ) WHERE id = 1;

-- Example of how to insert entities/keywords data for SEO entries (for reference)
-- UPDATE seos SET entities_keywords = JSON_ARRAY('prefab construction', 'modular homes', 'building solutions', 'sustainable building') WHERE id = 1;

-- Example of how to set page types for different pages
-- UPDATE seos SET page_type = 'home' WHERE slug = 'home';
-- UPDATE seos SET page_type = 'about' WHERE slug = 'about-us';
-- UPDATE seos SET page_type = 'contact' WHERE slug = 'contact-us';
-- UPDATE seos SET page_type = 'services' WHERE slug = 'services';
-- UPDATE seos SET page_type = 'products' WHERE slug = 'products';
