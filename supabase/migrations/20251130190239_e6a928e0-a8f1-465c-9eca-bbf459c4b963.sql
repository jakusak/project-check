-- Change required_by_date from date to text to support urgency levels
ALTER TABLE equipment_requests 
ALTER COLUMN required_by_date TYPE text;