-- SQL Queries to Debug Organization Deletion
-- Run these in your Supabase SQL Editor to check database state

-- 1. Check all organizations and their status
SELECT
    id,
    name,
    slug,
    subscription_tier,
    subscription_status,
    created_at,
    updated_at
FROM organizations
ORDER BY created_at DESC;

-- 2. Check organization memberships for a specific user
-- Replace 'YOUR_USER_ID' with the actual Firebase UID
SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.status,
    o.name as organization_name,
    om.created_at
FROM organization_memberships om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = 'YOUR_USER_ID'
ORDER BY om.created_at DESC;

-- 3. Check all memberships for a specific organization
-- Replace 'YOUR_ORG_ID' with the actual organization ID
SELECT
    om.id,
    om.user_id,
    om.role,
    om.status,
    om.created_at
FROM organization_memberships om
WHERE om.organization_id = 'YOUR_ORG_ID'
ORDER BY om.created_at DESC;

-- 4. Count active members per organization
SELECT
    o.id,
    o.name,
    COUNT(om.id) as active_members
FROM organizations o
LEFT JOIN organization_memberships om ON o.id = om.organization_id AND om.status = 'active'
GROUP BY o.id, o.name
ORDER BY o.created_at DESC;

-- 5. Check if organization exists by ID
-- Replace 'YOUR_ORG_ID' with the actual organization ID you're trying to delete
SELECT * FROM organizations WHERE id = 'YOUR_ORG_ID';

-- 6. Check recent organization deletions (if using audit logs)
SELECT
    id,
    name,
    slug,
    updated_at,
    created_at
FROM organizations
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- 7. Find organizations with no active members (orphaned orgs)
SELECT
    o.id,
    o.name,
    o.created_at
FROM organizations o
LEFT JOIN organization_memberships om ON o.id = om.organization_id AND om.status = 'active'
WHERE om.id IS NULL;

-- 8. Check database constraints that might prevent deletion
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'organizations' OR ccu.table_name = 'organizations');

-- 9. Check for any related data that might prevent deletion
-- You may need to adjust table names based on your schema
SELECT
    'organization_memberships' as table_name,
    COUNT(*) as count
FROM organization_memberships
WHERE organization_id = 'YOUR_ORG_ID'

UNION ALL

SELECT
    'organization_invitations' as table_name,
    COUNT(*) as count
FROM organization_invitations
WHERE organization_id = 'YOUR_ORG_ID'

-- Add more UNION ALL statements for other tables that reference organizations
;

-- 10. Manual cleanup (USE WITH CAUTION!)
-- Only run these if you need to manually clean up data

-- First, delete related data
-- DELETE FROM organization_memberships WHERE organization_id = 'YOUR_ORG_ID';
-- DELETE FROM organization_invitations WHERE organization_id = 'YOUR_ORG_ID';

-- Then delete the organization
-- DELETE FROM organizations WHERE id = 'YOUR_ORG_ID';