-- Migration: remove any 'pharmacie'/'pharmacies' categories, product categories and role
-- Safe to run multiple times; deletes nothing if terms are absent.

-- Remove restaurant categories named or slugs referencing pharmacies
DELETE FROM `categories_restaurants` WHERE LOWER(`slug`) = 'pharmacies' OR LOWER(`nom`) LIKE '%pharmaci%';

-- Remove product categories referencing pharmacies
DELETE FROM `categories_produits` WHERE LOWER(`nom`) LIKE '%pharmaci%';

-- Unset products that used a textual category 'pharmacies'
UPDATE `produits` SET `category` = NULL WHERE LOWER(`category`) LIKE '%pharmaci%';

-- Remove any role named or coded as 'pharmacie'
DELETE FROM `roles` WHERE LOWER(`code`) = 'pharmacie' OR LOWER(`libelle`) LIKE '%pharmaci%';

-- NOTE: If your application stored pharmacy-specific users or restaurants,
-- consider backing up affected rows before running. This migration only
-- removes category/role references to avoid showing the category in the app.
