const TOKEN_KEY = 'muebleria_cams_auth';

function getToken() {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    return JSON.parse(stored).token;
  } catch { return null; }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(endpoint, config);

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
      throw new Error(data.error || 'No autorizado');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Error de conexión con el servidor');
    }
    throw err;
  }
}

export const authAPI = {
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    }),
  me: () => request('/api/auth/me'),
};

export const vendedoresAPI = {
  getAll: () => request('/api/vendedores'),
  getById: (id) => request(`/api/vendedores/${id}`),
  create: (data) => request('/api/vendedores', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/vendedores/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/vendedores/${id}`, { method: 'DELETE' }),
};

export const productosAPI = {
  getAll: (activo) => request(`/api/productos${activo ? '?activo=true' : ''}`),
  getById: (id) => request(`/api/productos/${id}`),
  create: (data) => request('/api/productos', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/productos/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/productos/${id}`, { method: 'DELETE' }),
};

export const ventasAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/ventas${qs ? '?' + qs : ''}`);
  },
  getById: (id) => request(`/api/ventas/${id}`),
  create: (data) => request('/api/ventas', { method: 'POST', body: data }),
  createWithFiles: (formData) => {
    const token = getToken();
    return fetch('/api/ventas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');
      return data;
    });
  },
  remove: (id) => request(`/api/ventas/${id}`, { method: 'DELETE' }),
};

export const inventarioAPI = {
  getStock: () => request('/api/inventario/stock'),
  getMovimientos: (producto_id) =>
    request(`/api/inventario/movimientos${producto_id ? '?producto_id=' + producto_id : ''}`),
  entradaStock: (data) => request('/api/inventario/entrada', { method: 'POST', body: data }),
};

export function getDownloadUrl(path) {
  const token = getToken();
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}token=${encodeURIComponent(token || '')}`;
}

export const reportesAPI = {
  vendedor: (id, desde, hasta) => {
    const qs = new URLSearchParams({ desde, hasta }).toString();
    return getDownloadUrl(`/api/reportes/vendedor/${id}?${qs}`);
  },
  general: (desde, hasta) => {
    const qs = new URLSearchParams({ desde, hasta }).toString();
    return getDownloadUrl(`/api/reportes/general?${qs}`);
  },
  inventario: () => getDownloadUrl('/api/reportes/inventario'),
};

export const comprasAPI = {
  getAll: () => request('/api/compras'),
  getById: (id) => request(`/api/compras/${id}`),
  create: (data) => request('/api/compras', { method: 'POST', body: data }),
};

export const pagosAPI = {
  getAll: () => request('/api/pagos'),
  calcular: (inicio, fin) => request(`/api/pagos/calcular?semana_inicio=${inicio}&semana_fin=${fin}`, { method: 'POST' }),
  marcarPagado: (id) => request(`/api/pagos/${id}/pagar`, { method: 'PUT' }),
};

export const categoriasAPI = {
  getAll: () => request('/api/categorias'),
  create: (data) => request('/api/categorias', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/categorias/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/categorias/${id}`, { method: 'DELETE' }),
};

export const marcasAPI = {
  getAll: () => request('/api/marcas'),
  create: (data) => request('/api/marcas', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/marcas/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/marcas/${id}`, { method: 'DELETE' }),
};
