import { supabase } from '@/lib/supabase/client';
import { auth } from '@/lib/firebase';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subscription_tier: 'free' | 'starter' | 'business' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired' | 'trialing';
  settings: Record<string, any>;
  billing_info: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  permissions: Record<string, any>;
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  status: 'invited' | 'active' | 'suspended' | 'removed';
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface TenantContext {
  organizationId: string;
  userId: string;
  userRole: string;
  permissions: Record<string, any>;
}

class TenantService {
  private static instance: TenantService;
  private currentTenant: TenantContext | null = null;

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  /**
   * Set the current tenant context for all subsequent operations
   */
  async setTenantContext(organizationId: string): Promise<TenantContext | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify user belongs to this organization
      const { data: orgUser, error } = await supabase
        .from('organization_memberships')
        .select('role, permissions, status')
        .eq('organization_id', organizationId)
        .eq('user_id', user.uid)
        .eq('status', 'active')
        .single();

      if (error || !orgUser) {
        throw new Error('User not authorized for this organization');
      }

      // Set Supabase RLS context
      await supabase.rpc('set_current_user_id', { user_id: user.uid });

      this.currentTenant = {
        organizationId,
        userId: user.uid,
        userRole: orgUser.role,
        permissions: orgUser.permissions || {},
      };

      return this.currentTenant;
    } catch (error) {
      console.error('Failed to set tenant context:', error);
      return null;
    }
  }

  /**
   * Get the current tenant context
   */
  getCurrentTenant(): TenantContext | null {
    return this.currentTenant;
  }

  /**
   * Ensure user has required role or higher
   */
  requireRole(requiredRole: 'viewer' | 'member' | 'manager' | 'admin' | 'owner'): boolean {
    if (!this.currentTenant) {
      throw new Error('No tenant context set');
    }

    const roleHierarchy = ['viewer', 'member', 'manager', 'admin', 'owner'];
    const userLevel = roleHierarchy.indexOf(this.currentTenant.userRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);

    return userLevel >= requiredLevel;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentTenant) {
      return false;
    }

    // Owners and admins have all permissions
    if (['owner', 'admin'].includes(this.currentTenant.userRole)) {
      return true;
    }

    return !!this.currentTenant.permissions[permission];
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    name: string,
    slug: string,
    domain?: string
  ): Promise<Organization> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use the database function that handles everything properly
      console.log('🔍 DEBUG: Creating organization using database function');
      console.log('🔍 Parameters:', { name, slug, user_id: user.uid, email: user.email });

      const { data: orgId, error: createError } = await supabase.rpc('create_organization', {
        org_name: name,
        org_slug: slug,
        owner_firebase_uid: user.uid,
        owner_email: user.email || `${user.uid}@temp.com`
      });

      if (createError) {
        console.error('🚨 Organization creation failed:', createError);
        throw new Error(`Organization creation failed: ${createError.message}`);
      }

      console.log('✅ Organization created successfully with ID:', orgId);

      // Fetch the created organization
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (fetchError) {
        console.error('🚨 Failed to fetch created organization:', fetchError);
        throw new Error(`Failed to fetch organization: ${fetchError.message}`);
      }

      // Set this as current tenant
      await this.setTenantContext(org.id);

      return org;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(): Promise<(Organization & { role: string })[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Getting organizations for user:', user.uid);

      // First set the current user context for RLS
      const { error: rpcError } = await supabase.rpc('set_current_user_id', { user_id: user.uid });
      if (rpcError) {
        console.error('Failed to set user context:', rpcError);
      }

      // Step 1: Get user's memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('organization_id, role')
        .eq('user_id', user.uid)
        .eq('status', 'active');

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
        throw membershipError;
      }

      console.log('Found memberships:', memberships);

      if (!memberships || memberships.length === 0) {
        console.log('No active memberships found for user');
        return [];
      }

      // Step 2: Get organizations for those memberships
      const orgIds = memberships.map(m => m.organization_id);
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) {
        console.error('Error fetching organizations:', orgError);
        throw orgError;
      }

      console.log('Found organizations:', organizations);

      // Step 3: Combine data
      return (organizations || []).map(org => {
        const membership = memberships.find(m => m.organization_id === org.id);
        return {
          ...org,
          role: membership?.role || 'member',
        };
      });
    } catch (error) {
      console.error('Failed to get user organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by slug or domain
   */
  async getOrganizationByIdentifier(identifier: string): Promise<Organization | null> {
    try {
      // First try by slug, then by domain
      let { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', identifier)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found by slug, try domain
        ({ data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('domain', identifier)
          .single());
      }

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Failed to get organization:', error);
      return null;
    }
  }

  /**
   * Invite user to organization
   */
  async inviteUser(
    email: string,
    role: 'admin' | 'manager' | 'member' | 'viewer'
  ): Promise<OrganizationInvitation> {
    try {
      if (!this.currentTenant) {
        throw new Error('No tenant context set');
      }

      if (!this.requireRole('admin')) {
        throw new Error('Insufficient permissions to invite users');
      }

      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: this.currentTenant.organizationId,
          email,
          role,
          invited_by: this.currentTenant.userId,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send invitation email

      return data;
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  }

  /**
   * Accept organization invitation
   */
  async acceptInvitation(token: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get invitation
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', user.email)
        .single();

      if (error || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user to organization
      await supabase
        .from('organization_memberships')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.uid,
          role: invitation.role,
          status: 'active',
        });

      // Mark invitation as accepted
      await supabase
        .from('organization_invitations')
        .update({
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      return true;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Remove user from organization
   */
  async removeUser(userId: string): Promise<boolean> {
    try {
      if (!this.currentTenant) {
        throw new Error('No tenant context set');
      }

      if (!this.requireRole('admin')) {
        throw new Error('Insufficient permissions to remove users');
      }

      const { error } = await supabase
        .from('organization_memberships')
        .update({ status: 'removed' })
        .eq('organization_id', this.currentTenant.organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to remove user:', error);
      throw error;
    }
  }

  /**
   * Update user role in organization
   */
  async updateUserRole(
    userId: string,
    role: 'admin' | 'manager' | 'member' | 'viewer'
  ): Promise<boolean> {
    try {
      if (!this.currentTenant) {
        throw new Error('No tenant context set');
      }

      if (!this.requireRole('admin')) {
        throw new Error('Insufficient permissions to update user roles');
      }

      const { error } = await supabase
        .from('organization_memberships')
        .update({ role })
        .eq('organization_id', this.currentTenant.organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(): Promise<OrganizationUser[]> {
    try {
      if (!this.currentTenant) {
        throw new Error('No tenant context set');
      }

      const { data, error } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('organization_id', this.currentTenant.organizationId)
        .in('status', ['active', 'invited'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get organization users:', error);
      throw error;
    }
  }

  /**
   * Delete organization (only for owners)
   */
  async deleteOrganization(organizationId: string): Promise<boolean> {
    try {
      if (!this.currentTenant) {
        throw new Error('No tenant context set');
      }

      if (!this.requireRole('owner')) {
        throw new Error('Only organization owners can delete organizations');
      }

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;

      // Clear tenant context if deleting current organization
      if (this.currentTenant.organizationId === organizationId) {
        this.currentTenant = null;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete organization:', error);
      throw error;
    }
  }

  /**
   * Migrate existing user data to organization
   */
  async migrateUserDataToOrganization(organizationId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('migrate_user_to_organization', {
        firebase_uid: user.uid,
        org_id: organizationId,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to migrate user data:', error);
      throw error;
    }
  }
}

export const tenantService = TenantService.getInstance();
export type { TenantService };