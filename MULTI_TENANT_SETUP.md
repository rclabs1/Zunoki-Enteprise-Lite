# Multi-Tenant Enterprise Setup Guide

This guide walks you through setting up the complete multi-tenant enterprise architecture for Zunoki Enterprise Lite.

## 📋 Overview

The multi-tenant architecture provides:

- **Complete Data Isolation**: Each organization has isolated data with Row Level Security (RLS)
- **Flexible Routing**: Support for subdomains, custom domains, and path-based routing
- **Role-Based Access Control**: Granular permissions and role hierarchies
- **Enterprise Features**: White-labeling, custom branding, and feature flags
- **Scalable Configuration**: Per-tenant settings and limits

## 🚀 Quick Setup

### 1. Database Migration

Run the multi-tenant schema migration:

```sql
-- Execute the schema file
\i lib/multi-tenant/tenant-schema.sql
```

Or manually execute:
```bash
psql -d your_database -f lib/multi-tenant/tenant-schema.sql
```

### 2. Environment Variables

Update your `.env.local` with proper credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_real_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF123

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Firebase Admin Setup

Create `lib/firebase-admin.ts` for server-side Firebase operations:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const verifyFirebaseToken = async (token: string) => {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid token',
    };
  }
};
```

### 4. First Organization Setup

After deployment, create your first organization:

```typescript
// In your app or via API
import { tenantService } from '@/lib/multi-tenant/tenant-service';

const org = await tenantService.createOrganization(
  'Your Company',
  'your-company',
  'app.yourcompany.com' // optional custom domain
);
```

## 🏗️ Architecture Components

### 1. Database Schema

- **organizations**: Tenant/organization management
- **organization_users**: User-organization relationships with roles
- **organization_***: Tenant-specific resources (agents, knowledge bases, templates)
- **RLS Policies**: Automatic data isolation

### 2. Services

- **TenantService**: Core organization management
- **TenantConfigService**: Feature flags and configuration
- **TenantAwareServices**: Data services with automatic tenant isolation

### 3. Middleware

- **tenant-middleware.ts**: API route protection and tenant context
- **middleware.ts**: Next.js routing middleware for subdomains

### 4. Frontend Components

- **TenantLayout**: Organization-specific layouts with branding
- **Organization Selection**: Multi-organization picker

## 📚 Usage Examples

### Creating Tenant-Aware API Routes

```typescript
import { withTenantContext } from '@/lib/multi-tenant/tenant-middleware';

export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (req, tenant) => {
      // Your tenant-aware logic here
      // tenant.organizationId is automatically available
      return Response.json({ data: 'tenant-specific-data' });
    },
    { requireRole: 'viewer' } // Optional role requirement
  );
}
```

### Using Tenant-Aware Services

```typescript
import { tenantService, tenantCampaignService } from '@/lib/multi-tenant';

// Set tenant context
await tenantService.setTenantContext(organizationId);

// All subsequent service calls are automatically tenant-scoped
const campaigns = await tenantCampaignService.getCampaignMetrics();
```

### Configuration Management

```typescript
import { tenantConfigService } from '@/lib/multi-tenant/tenant-config';

// Check feature availability
const mayaEnabled = await tenantConfigService.isFeatureEnabled('maya_enabled');

// Get branding for UI
const branding = await tenantConfigService.getBranding();

// Check usage limits
const apiLimit = await tenantConfigService.checkLimit('api_calls_per_month', currentUsage);
```

## 🔒 Security Features

### Row Level Security (RLS)

All tenant data is automatically isolated using PostgreSQL RLS policies:

```sql
-- Example: Users can only see their organization's data
CREATE POLICY campaign_metrics_org_access ON campaign_metrics
  FOR ALL USING (
    organization_id = ANY(get_user_organization_ids(current_setting('app.current_user_id')::TEXT))
  );
```

### Role-Based Access Control

Five-tier role hierarchy:
- **Owner**: Full control including billing and deletion
- **Admin**: User management and configuration
- **Manager**: Content and workflow management
- **Member**: Standard user access
- **Viewer**: Read-only access

### API Security

All API routes are protected with:
- Firebase authentication
- Tenant context validation
- Role-based authorization
- Permission checking

## 🌐 Routing Options

### 1. Subdomain Routing (Recommended)

```
acme.zunoki.com → /org/acme/*
enterprise.zunoki.com → /org/enterprise/*
```

### 2. Custom Domain Routing (Enterprise)

```
app.acmecorp.com → Organization: acme-corp
portal.enterprise.com → Organization: enterprise-inc
```

### 3. Path-Based Routing

```
zunoki.com/org/acme/* → Organization: acme
zunoki.com/org/enterprise/* → Organization: enterprise
```

### 4. API Header Routing

```
X-Organization-ID: uuid
X-Organization-Slug: acme
```

## 📊 Migration from Single-Tenant

### 1. Data Migration

```sql
-- Create default organization for existing users
INSERT INTO organizations (name, slug, plan_type)
VALUES ('Default Organization', 'default', 'enterprise');

-- Migrate existing users to organization
INSERT INTO organization_users (organization_id, user_id, role, status)
SELECT
  (SELECT id FROM organizations WHERE slug = 'default'),
  uid,
  'admin',
  'active'
FROM user_profiles;

-- Migrate existing data
UPDATE campaign_metrics
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default');

UPDATE oauth_tokens
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default');

-- Repeat for all tenant-aware tables
```

### 2. Code Migration

Update existing services to use tenant-aware versions:

```typescript
// OLD
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
const campaigns = await supabaseMultiUserService.getCampaignMetrics();

// NEW
import { tenantCampaignService } from '@/lib/multi-tenant/tenant-aware-services';
await tenantService.setTenantContext(organizationId);
const campaigns = await tenantCampaignService.getCampaignMetrics();
```

## 🎨 White-Label Configuration

### Branding Setup

```typescript
await tenantConfigService.updateConfig({
  branding: {
    name: 'Acme Portal',
    logo_url: 'https://acme.com/logo.png',
    primary_color: '#FF6B35',
    secondary_color: '#F7931E',
    favicon_url: 'https://acme.com/favicon.ico',
    custom_css: `
      .custom-header { background: linear-gradient(45deg, #FF6B35, #F7931E); }
    `
  }
});
```

### Feature Flags

```typescript
await tenantConfigService.updateConfig({
  features: {
    maya_enabled: true,
    max_maya_conversations_per_month: 10000,
    custom_ai_models: true,
    white_label: true,
    custom_domain: true,
    sso_enabled: true
  }
});
```

## 📈 Monitoring & Analytics

### Usage Tracking

```typescript
import { tenantActivityService } from '@/lib/multi-tenant/tenant-aware-services';

// Track user activities
await tenantActivityService.trackActivity('CAMPAIGN_CREATED', {
  campaign_id: 'camp_123',
  platform: 'google-ads'
});

// Get organization activities
const activities = await tenantActivityService.getOrganizationActivities(100);
```

### Limit Monitoring

```typescript
// Check API usage
const apiUsage = await tenantConfigService.checkLimit('api_calls_per_month', 45000);
if (apiUsage.exceeded) {
  // Handle limit exceeded
}

// Alert at threshold
if (apiUsage.percent > 80) {
  // Send warning notification
}
```

## 🔧 Troubleshooting

### Common Issues

1. **RLS Policies Not Working**
   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';

   -- Enable RLS if missing
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Tenant Context Not Set**
   ```typescript
   // Always set tenant context before service calls
   const tenant = tenantService.getCurrentTenant();
   if (!tenant) {
     await tenantService.setTenantContext(organizationId);
   }
   ```

3. **Permission Denied Errors**
   ```typescript
   // Check user role and permissions
   const hasAccess = tenantService.requireRole('admin');
   const hasPermission = tenantService.hasPermission('manage_campaigns');
   ```

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('debug', 'tenant:*');

// Check tenant context
console.log('Current tenant:', tenantService.getCurrentTenant());

// Verify organization access
const orgs = await tenantService.getUserOrganizations();
console.log('User organizations:', orgs);
```

## 🚀 Production Deployment

### DNS Configuration

For subdomain routing:
```
*.yourdomain.com → Your app server
```

For custom domains, each enterprise customer needs:
```
app.customer.com → Your app server (with proper SSL)
```

### Environment Variables

```env
# Production Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=prod_api_key
FIREBASE_PROJECT_ID=prod-project-id
FIREBASE_CLIENT_EMAIL=service-account@prod-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key
```

### Performance Optimization

1. **Database Indexing**
   ```sql
   -- Critical indexes are included in schema
   -- Monitor query performance and add as needed
   CREATE INDEX CONCURRENTLY idx_table_org_date
   ON table_name (organization_id, created_at);
   ```

2. **Connection Pooling**
   ```typescript
   // Use connection pooling for Supabase
   const supabase = createClient(url, key, {
     db: { schema: 'public' },
     global: { headers: { 'x-application': 'zunoki-enterprise' } }
   });
   ```

3. **Caching**
   ```typescript
   // Cache tenant configurations
   const config = await tenantConfigService.getConfig();
   // Configs are automatically cached per organization
   ```

## 📞 Support

For enterprise deployment support:
- Check the troubleshooting section above
- Review the API documentation in each service file
- Test with the provided example routes
- Monitor logs for tenant context and permission errors

The multi-tenant architecture is designed to be secure, scalable, and enterprise-ready out of the box.