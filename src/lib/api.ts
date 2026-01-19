import type { ApiActivity, ApiRole, ApiSignup, ApiUser, AuthResponse, ApiError, ApiTransportPair } from './apiTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('token');
}

// Set auth token
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

// Remove auth token
export function removeToken(): void {
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
    let error: ApiError;
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
  register: async (name: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  login: async (name: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  getMe: async (): Promise<{ user: ApiUser }> => {
    return request<{ user: ApiUser }>('/auth/me');
  },
};

// Activities API
export const activitiesApi = {
  getAll: async (): Promise<ApiActivity[]> => {
    return request<ApiActivity[]>('/activities');
  },

  getOne: async (id: string): Promise<ApiActivity> => {
    return request<ApiActivity>(`/activities/${id}`);
  },

  create: async (data: {
    name: string;
    date: string;
    massupTime?: string;
    description: string;
    zone?: string;
    minEquip?: string;
    type?: 'regular' | 'transport';
  }): Promise<ApiActivity> => {
    return request<ApiActivity>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    name?: string;
    date?: string;
    massupTime?: string;
    description?: string;
    zone?: string;
    minEquip?: string;
    status?: 'recruiting' | 'full' | 'running';
    type?: 'regular' | 'transport';
  }): Promise<ApiActivity> => {
    return request<ApiActivity>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/activities/${id}`, {
      method: 'DELETE',
    });
  },
};

// Roles API
export const rolesApi = {
  getByActivity: async (activityId: string): Promise<ApiRole[]> => {
    return request<ApiRole[]>(`/roles/activity/${activityId}`);
  },

  create: async (data: {
    activityId: string;
    name: string;
    slots: number;
    attributes?: Record<string, unknown>;
  }): Promise<ApiRole> => {
    return request<ApiRole>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    name?: string;
    slots?: number;
    attributes?: Record<string, unknown>;
  }): Promise<ApiRole> => {
    return request<ApiRole>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Signups API
export const signupsApi = {
  getByActivity: async (activityId: string): Promise<ApiSignup[]> => {
    return request<ApiSignup[]>(`/signups/activity/${activityId}`);
  },

  create: async (data: {
    activityId: string;
    roleId: string;
    attributes?: Record<string, unknown>;
    comment?: string;
  }): Promise<ApiSignup> => {
    return request<ApiSignup>('/signups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    attributes?: Record<string, unknown>;
    comment?: string;
  }): Promise<ApiSignup> => {
    return request<ApiSignup>(`/signups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/signups/${id}`, {
      method: 'DELETE',
    });
  },
};

// Pairs API
export const pairsApi = {
  getByActivity: async (activityId: string): Promise<ApiTransportPair[]> => {
    return request<ApiTransportPair[]>(`/pairs/activity/${activityId}`);
  },

  create: async (data: {
    activityId: string;
    fighterId: string;
    transporterId: string;
  }): Promise<ApiTransportPair> => {
    return request<ApiTransportPair>('/pairs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    fighterId?: string;
    transporterId?: string;
  }): Promise<ApiTransportPair> => {
    return request<ApiTransportPair>(`/pairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/pairs/${id}`, {
      method: 'DELETE',
    });
  },
};
