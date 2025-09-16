'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { userService } from '@/lib/user-service';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrackPageView } from "@/hooks/use-track-page-view";

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  useTrackPageView("Admin Users");
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        // Redirect or show unauthorized message
      } else {
        fetchUsers();
      }
    }
  }, [user, loading, isAdmin]);

  const fetchUsers = async () => {
    setPageLoading(true);
    try {
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers || []);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    }
    setPageLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await userService.updateUserRole(userId, newRole);
      toast({
        title: 'User role updated',
        description: 'The user role has been successfully updated.',
      });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-4xl font-bold mb-8">Manage Users</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900 p-4 rounded-lg flex justify-between items-center border border-gray-800">
              <div>
                <Skeleton className="h-6 w-48 mb-2 bg-gray-800" />
                <Skeleton className="h-4 w-64 bg-gray-800" />
              </div>
              <Skeleton className="h-10 w-24 bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">You are not authorized to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Manage Users</h1>
      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.user_id} className="bg-gray-900 p-4 rounded-lg flex justify-between items-center border border-gray-800">
            <div>
              <p className="font-semibold text-lg">{u.full_name || 'No name'}</p>
              <p className="text-gray-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className={`font-semibold ${u.role === 'admin' ? 'text-red-500' : 'text-gray-300'}`}>
                {u.role}
              </p>
              {u.role === 'admin' ? (
                <Button
                  onClick={() => handleRoleChange(u.user_id, 'user')}
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  Revoke Admin
                </Button>
              ) : (
                <Button
                  onClick={() => handleRoleChange(u.user_id, 'admin')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Make Admin
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
