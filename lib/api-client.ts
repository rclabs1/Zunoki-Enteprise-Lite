import { auth } from '@/lib/firebase';

/**
 * API client that automatically includes Firebase authentication token
 */
export class ApiClient {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const user = auth.currentUser;
      
      if (user) {
        user.getIdToken(true)
          .then(idToken => {
            resolve({
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            });
          })
          .catch(error => {
            console.error('Failed to get Firebase ID token:', error);
            reject(new Error('Failed to authenticate'));
          });
      } else {
        // Wait for auth state to load if not already loaded
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
            user.getIdToken(true)
              .then(idToken => {
                resolve({
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json',
                });
              })
              .catch(error => {
                console.error('Failed to get Firebase ID token:', error);
                reject(new Error('Failed to authenticate'));
              });
          } else {
            reject(new Error('User not authenticated'));
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Authentication timeout'));
        }, 5000);
      }
    });
  }

  /**
   * GET request with Firebase authentication
   */
  static async get(url: string): Promise<any> {
    const headers = await ApiClient.getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST request with Firebase authentication
   */
  static async post(url: string, data?: any): Promise<any> {
    const headers = await ApiClient.getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * PUT request with Firebase authentication
   */
  static async put(url: string, data?: any): Promise<any> {
    const headers = await ApiClient.getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * DELETE request with Firebase authentication
   */
  static async delete(url: string): Promise<any> {
    const headers = await ApiClient.getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Convenience functions
export const apiGet = ApiClient.get;
export const apiPost = ApiClient.post;
export const apiPut = ApiClient.put;
export const apiDelete = ApiClient.delete;