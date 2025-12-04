import { AxiosError } from 'axios';

/**
 * Extract error message from API response
 * API can send errors in different formats: error, detail, or msg
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    // Check for error message in various fields
    if (data) {
      // Priority 1: 'detail' field (FastAPI format)
      if (data.detail) {
        if (typeof data.detail === 'string') {
          return data.detail;
        }
        // Handle array of validation errors
        if (Array.isArray(data.detail)) {
          return data.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
        }
      }

      // Priority 2: 'error' field
      if (data.error) {
        if (typeof data.error === 'string') {
          return data.error;
        }
      }

      // Priority 3: 'msg' or 'message' field
      if (data.msg) {
        return data.msg;
      }
      if (data.message) {
        return data.message;
      }

      // If data is a plain string
      if (typeof data === 'string') {
        return data;
      }
    }

    // Handle specific status codes
    if (error.response?.status === 401) {
      return 'Unauthorized. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    if (error.response?.status === 422) {
      return 'Validation error. Please check your input.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }

    // Network errors
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to connect to server. Please check your connection.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};
