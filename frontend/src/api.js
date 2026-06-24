// Small fetch wrapper: attaches the JWT, parses JSON, surfaces the backend's error envelope
// (including per-field validation errors), and redirects to /login on 401.

const TOKEN_KEY = 'flexiwork_token';

// "Remember me" decides where the token lives: localStorage survives browser restarts,
// sessionStorage clears when the tab/browser closes.
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  set: (t, remember = true) => {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, t);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, t);
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

/** Error carrying HTTP status and optional fieldErrors map from the API. */
export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || {};
  }
}

async function request(method, path, { body, isForm } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData; let the browser set the boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(path, { method, headers, body: payload });

  if (res.status === 401) {
    tokenStore.clear();
    if (!path.includes('/auth/login')) window.location.href = '/login';
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.startsWith('image/')) {
    if (!res.ok) throw new ApiError('Request failed', res.status);
    return await res.blob();
  }

  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (data && data.message) || 'Something went wrong';
    throw new ApiError(message, res.status, data && data.fieldErrors);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, body) => request('POST', p, { body }),
  put: (p, body) => request('PUT', p, { body }),
  del: (p) => request('DELETE', p),
  postForm: (p, formData) => request('POST', p, { body: formData, isForm: true }),
};
