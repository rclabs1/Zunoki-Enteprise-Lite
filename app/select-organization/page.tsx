'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { tenantService, Organization } from '@/lib/multi-tenant/tenant-service';

interface OrganizationWithRole extends Organization {
  role: string;
}

export default function SelectOrganizationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    organization: OrganizationWithRole | null;
  }>({ show: false, organization: null });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationWithRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleOrg, setRoleOrg] = useState<OrganizationWithRole | null>(null);

  useEffect(() => {
    async function loadOrganizations() {
      if (authLoading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      // Check subscription status and redirect accordingly
      try {
        const response = await fetch('/api/user/subscription-status', {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        const subscriptionData = await response.json();

        console.log('🔍 Full subscription response:', subscriptionData);

        if (subscriptionData.needsOnboarding) {
          // User needs to complete payment
          router.push('/onboarding/plans');
          return;
        }

        // If we get here, load organizations for selection
        if (subscriptionData.organizations && subscriptionData.organizations.length > 0) {
          setOrganizations(subscriptionData.organizations);
          setLoading(false);
          return;
        }

        // No organizations found, but user is authenticated
        setOrganizations([]);
        setLoading(false);

      } catch (error) {
        console.error('Error checking subscription:', error);
        // If subscription check fails, redirect to plans
        router.push('/onboarding/plans');
        return;
      }
    }

    loadOrganizations();
  }, [user, authLoading, router]);

  const handleSelectOrganization = (org: OrganizationWithRole) => {
    // Redirect to organization dashboard using organization ID
    router.push(`/org/${org.id}/dashboard`);
  };

  const handleCreateOrganization = () => {
    setShowCreateModal(true);
  };

  const handleDeleteOrganization = (org: OrganizationWithRole) => {
    setDeleteConfirmModal({ show: true, organization: org });
  };

  const confirmDeleteOrganization = async () => {
    const org = deleteConfirmModal.organization;
    if (!org) return;

    setDeletingOrgId(org.id);
    setDeleteConfirmModal({ show: false, organization: null });

    try {
      // Call API to delete organization
      const response = await fetch(`/api/organizations/${org.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user!.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      // Remove from local state
      setOrganizations(prev => prev.filter(o => o.id !== org.id));
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization. Please try again.');
    } finally {
      setDeletingOrgId(null);
    }
  };

  const cancelDeleteOrganization = () => {
    setDeleteConfirmModal({ show: false, organization: null });
  };

  const handleEditOrganization = (org: OrganizationWithRole) => {
    setEditingOrg(org);
    setShowEditModal(true);
  };

  const handleManageRoles = (org: OrganizationWithRole) => {
    setRoleOrg(org);
    setShowRoleModal(true);
  };

  const handleSaveOrganization = async (updates: { name: string; domain?: string }) => {
    if (!editingOrg || !user) return;

    try {
      setDeletingOrgId(editingOrg.id); // Reuse this for saving state

      const response = await fetch(`/api/organizations/${editingOrg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update organization');
      }

      const updatedOrg = await response.json();

      // Update local state
      setOrganizations(prev =>
        prev.map(o => o.id === editingOrg.id ? { ...o, ...updatedOrg } : o)
      );

      setShowEditModal(false);
      setEditingOrg(null);
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization. Please try again.');
    } finally {
      setDeletingOrgId(null);
    }
  };

  const cancelEditOrganization = () => {
    setShowEditModal(false);
    setEditingOrg(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-900 mb-4">Error</h1>
          <p className="text-green-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-900 mb-4">
            Select Organization
          </h1>
          <p className="text-lg text-green-700">
            Choose an organization to continue to your dashboard
          </p>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-green-200 hover:border-green-300"
              onClick={() => handleSelectOrganization(org)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-green-900">
                    {org.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      org.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : org.subscription_status === 'trialing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {org.subscription_status}
                    </span>
                    {/* Action buttons for owners and admins */}
                    <div className="flex items-center space-x-1">
                      {/* Edit button - owners and admins */}
                      {(org.role === 'owner' || org.role === 'admin') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOrganization(org);
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Organization"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Manage roles button - owners and admins */}
                      {(org.role === 'owner' || org.role === 'admin') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageRoles(org);
                          }}
                          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                          title="Manage Members & Roles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </button>
                      )}

                      {/* Delete button - owners only */}
                      {org.role === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrganization(org);
                          }}
                          disabled={deletingOrgId === org.id}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete Organization"
                        >
                          {deletingOrgId === org.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Your Role:</span>
                    <span className={`font-medium ${
                      org.role === 'owner'
                        ? 'text-green-700'
                        : org.role === 'admin'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Plan:</span>
                    <span className="font-medium text-green-900">
                      {org.subscription_tier.charAt(0).toUpperCase() + org.subscription_tier.slice(1)}
                    </span>
                  </div>

                  {org.domain && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Domain:</span>
                      <span className="font-mono text-xs text-green-700">
                        {org.domain}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-green-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOrganization(org);
                    }}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Access Dashboard
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Create New Organization Card */}
          <div
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-green-300 hover:border-green-400"
            onClick={handleCreateOrganization}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Create New Organization
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Set up a new enterprise workspace
              </p>
              <button className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* No Organizations State */}
        {organizations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              No Organizations Found
            </h3>
            <p className="text-green-700 mb-6">
              You don't belong to any organizations yet. Create one to get started.
            </p>
            <button
              onClick={handleCreateOrganization}
              className="bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors"
            >
              Create Your First Organization
            </button>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(org) => {
            setShowCreateModal(false);
            router.push(`/org/${org.id}/dashboard`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && deleteConfirmModal.organization && (
        <DeleteConfirmationModal
          organization={deleteConfirmModal.organization}
          onConfirm={confirmDeleteOrganization}
          onCancel={cancelDeleteOrganization}
          isDeleting={deletingOrgId === deleteConfirmModal.organization.id}
        />
      )}

      {/* Edit Organization Modal */}
      {showEditModal && editingOrg && (
        <EditOrganizationModal
          organization={editingOrg}
          onSave={handleSaveOrganization}
          onCancel={cancelEditOrganization}
          isSaving={deletingOrgId === editingOrg.id}
        />
      )}

      {/* Role Management Modal */}
      {showRoleModal && roleOrg && (
        <RoleManagementModal
          organization={roleOrg}
          onClose={() => {
            setShowRoleModal(false);
            setRoleOrg(null);
          }}
        />
      )}
    </div>
  );
}

function CreateOrganizationModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (org: Organization) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const org = await tenantService.createOrganization(
        formData.name,
        formData.slug,
        formData.domain || undefined
      );
      onSuccess(org);
    } catch (err: any) {
      if (err.message?.includes('duplicate key value violates unique constraint "organizations_slug_key"') ||
          err.message?.includes('slug_key')) {
        setError(`The slug "${formData.slug}" is already taken. Please choose a different one.`);
      } else {
        setError(err.message || 'Failed to create organization');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50) || 'org'
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="acme-corp"
                pattern="^[a-z0-9\-]+$"
                title="Only lowercase letters, numbers, and hyphens allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your organization's URL: zunoki.com/org/{formData.slug}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="app.acmecorp.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enterprise feature: Use your own domain
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditOrganizationModal({
  organization,
  onSave,
  onCancel,
  isSaving
}: {
  organization: OrganizationWithRole;
  onSave: (updates: { name: string; domain?: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(organization.name);
  const [domain, setDomain] = useState(organization.domain || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      domain: domain.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
          Edit Organization
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label htmlFor="org-domain" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Domain (optional)
              </label>
              <input
                id="org-domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                placeholder="example.com"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleManagementModal({
  organization,
  onClose,
}: {
  organization: OrganizationWithRole;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);

        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch members directly using Supabase client
        const { supabase } = await import('@/lib/supabase/client');

        const { data: orgMembers, error: membersError } = await supabase
          .from('organization_memberships')
          .select('*')
          .eq('organization_id', organization.id)
          .in('status', ['active', 'invited'])
          .order('created_at', { ascending: true });

        if (membersError) {
          throw membersError;
        }

        setMembers(orgMembers || []);
      } catch (err) {
        console.error('Failed to load members:', err);
        setError('Failed to load organization members');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [organization.id, user]);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      if (!user) return;

      // Update role via API
      const response = await fetch('/api/organizations/members/update-role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          organizationId: organization.id,
          userId,
          role: newRole
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Reload members
      const { supabase } = await import('@/lib/supabase/client');
      const { data: orgMembers, error: membersError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('organization_id', organization.id)
        .in('status', ['active', 'invited'])
        .order('created_at', { ascending: true });

      if (!membersError && orgMembers) {
        setMembers(orgMembers);
      }
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update user role');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      if (!user) return;

      // Remove user via API
      const response = await fetch('/api/organizations/members/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          organizationId: organization.id,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      // Reload members
      const { supabase } = await import('@/lib/supabase/client');
      const { data: orgMembers, error: membersError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('organization_id', organization.id)
        .in('status', ['active', 'invited'])
        .order('created_at', { ascending: true });

      if (!membersError && orgMembers) {
        setMembers(orgMembers);
      }
    } catch (err) {
      console.error('Failed to remove user:', err);
      setError('Failed to remove user');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl transform transition-all max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manage Members & Roles</h2>
              <p className="text-gray-600">{organization.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Invite User</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2 text-gray-600">Loading members...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No members found</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 font-medium">
                        {member.user_id.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user_id}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleUpdate(member.user_id, e.target.value)}
                      disabled={member.role === 'owner'}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>

                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveUser(member.user_id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          organization={organization}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            // Reload members to show new invitation
            const reloadMembers = async () => {
              const { supabase } = await import('@/lib/supabase/client');
              const { data: orgMembers, error: membersError } = await supabase
                .from('organization_memberships')
                .select('*')
                .eq('organization_id', organization.id)
                .in('status', ['active', 'invited'])
                .order('created_at', { ascending: true });

              if (!membersError && orgMembers) {
                setMembers(orgMembers);
              }
            };
            reloadMembers();
          }}
        />
      )}
    </div>
  );
}

function InviteUserModal({
  organization,
  onClose,
  onSuccess,
}: {
  organization: OrganizationWithRole;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim()) return;

    try {
      setIsInviting(true);
      setError(null);

      const response = await fetch('/api/organizations/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          organizationId: organization.id,
          email: email.trim(),
          role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to invite user:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Invite User to {organization.name}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Send an invitation to join this organization
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isInviting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isInviting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="viewer">Viewer - Can view reports (limited access until payment)</option>
                <option value="member">Member - Basic access</option>
                <option value="manager">Manager - Can manage content</option>
                <option value="admin">Admin - Full management access</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Note: Users will have limited report access until they complete payment
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isInviting}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInviting || !email.trim()}
              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {isInviting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({
  organization,
  onConfirm,
  onCancel,
  isDeleting
}: {
  organization: OrganizationWithRole;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
        {/* Header with warning icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Delete Organization
        </h2>

        {/* Organization name */}
        <div className="text-center mb-4">
          <p className="text-gray-600 mb-2">Are you sure you want to delete</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
            <p className="font-semibold text-green-800">{organization.name}</p>
            <p className="text-sm text-green-600">Role: {organization.role}</p>
          </div>
        </div>

        {/* Warning message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-800 font-medium">This action cannot be undone</p>
              <p className="text-red-600 text-sm mt-1">
                All organization data, settings, and conversations will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete Organization'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}