const API_URL = '/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (endpoint.includes('/reportes/') && options.responseType === 'blob') {
    return response;
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const vendedoresAPI = {
  getAll: () => request('/vendedores'),
  getById: (id) => request(`/vendedores/${id}`),
  create: (data) => request('/vendedores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/vendedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/vendedores/${id}`, { method: 'DELETE' }),
};

export const productosAPI = {
  getAll: (activo) => request(`/productos${activo !== undefined ? `?activo=${activo}` : ''}`),
  getById: (id) => request(`/productos/${id}`),
  create: (data) => request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/productos/${id}`, { method: 'DELETE' }),
};

export const ventasAPI = {
  getAll: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/ventas${query}`);
  },
  getById: (id) => request(`/ventas/${id}`),
  create: (data) => request('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) => request(`/ventas/${id}`, { method: 'DELETE' }),
};

export const inventarioAPI = {
  getMovimientos: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/inventario/movimientos${query}`);
  },
  getStock: () => request('/inventario/stock'),
  entradaStock: (data) => request('/inventario/entrada', { method: 'POST', body: JSON.stringify(data) }),
};

export const reportesAPI = {
  reporteVendedor: (id, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/reportes/vendedor/${id}${query}`, { responseType: 'blob' });
  },
  reporteGeneral: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/reportes/general${query}`, { responseType: 'blob' });
  },
  reporteInventario: () => request('/reportes/inventario', { responseType: 'blob' }),
};
