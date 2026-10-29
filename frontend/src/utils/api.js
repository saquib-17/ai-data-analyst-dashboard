/**
 * Unified API configuration helper.
 * Resolves the base URL using VITE_API_URL if provided, or falls back to
 * relative path in development or same-origin deployments.
 */
const rawBase = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawBase ? rawBase.replace(/\/+$/, '') : '';

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

