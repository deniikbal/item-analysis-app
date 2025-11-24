-- Migration: Change test_date column from varchar to date
-- This migration changes the test_date column from varchar to date type

-- Step 1: Add a temporary column with date type
ALTER TABLE test_info ADD COLUMN test_date_new DATE;

-- Step 2: Convert existing varchar dates to date format (if any)
-- Format expected: YYYY-MM-DD or will be NULL if conversion fails
UPDATE test_info 
SET test_date_new = CASE 
  WHEN test_date IS NOT NULL AND test_date != '' 
  THEN test_date::DATE 
  ELSE NULL 
END;

-- Step 3: Drop the old varchar column
ALTER TABLE test_info DROP COLUMN test_date;

-- Step 4: Rename the new column to the original name
ALTER TABLE test_info RENAME COLUMN test_date_new TO test_date;

-- Note: Run this migration carefully. Backup your database first.
