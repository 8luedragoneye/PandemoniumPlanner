const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('token');
}

// Set auth token
export function setToken(token: string) {
  localStorage.setItem('token', token);
}

// Remove auth token
export function removeToken() {
  localStorage.removeItem('token');
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: errorText || 'Request failed' };
    }
    console.error('API request failed:', response.status, error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Auth API
export const authApi = {
  register: async (name: string) => {
    try {
      console.log('Sending register request for name:', name);
      const data = await request<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      console.log('Register API response:', data);
      if (data && data.token) {
        setToken(data.token);
        console.log('Token saved to localStorage');
      } else {
        console.error('No token in response:', data);
      }
      return data;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  login: async (name: string) => {
    try {
      console.log('Sending login request for name:', name);
      const data = await request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      console.log('Login API response:', data);
      if (data && data.token) {
        setToken(data.token);
        console.log('Token saved to localStorage');
      } else {
        console.error('No token in response:', data);
      }
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  getMe: async () => {
    return request<{ user: any }>('/auth/me');
  },
};

// Activities API
export const activitiesApi = {
  getAll: async () => {
    return request<any[]>('/activities');
  },

  getOne: async (id: string) => {
    return request<any>(`/activities/${id}`);
  },

  create: async (data: any) => {
    return request<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/activities/${id}`, {
      method: 'DELETE',
    });
  },
};

// Roles API
export const rolesApi = {
  getByActivity: async (activityId: string) => {
    return request<any[]>(`/roles/activity/${activityId}`);
  },

  create: async (data: any) => {
    return request<any>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Signups API
export const signupsApi = {
  getByActivity: async (activityId: string) => {
    return request<any[]>(`/signups/activity/${activityId}`);
  },

  create: async (data: any) => {
    return request<any>('/signups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return request<any>(`/signups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/signups/${id}`, {
      method: 'DELETE',
    });
  },
};
