// Single switch between local fixtures and the real API. Only VITE_* values are public.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
