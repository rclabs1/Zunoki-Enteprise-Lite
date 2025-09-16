import { auth } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  company?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
}

interface ProfileUpdateData {
  displayName: string;
  company?: string;
  bio?: string;
  avatar_url?: string;
}

class ProfileService {
  private static instance: ProfileService;

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      if (result.warning) {
        console.warn('Profile service warning:', result.warning);
      }

      return result.profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(updates: ProfileUpdateData): Promise<UserProfile> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      return result.profile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export const profileService = ProfileService.getInstance();
export type { UserProfile, ProfileUpdateData };