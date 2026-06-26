import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (!success) setError('Usuario o contraseña incorrectos');
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-wood-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-white/[0.02] rounded-full" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="px-8 pt-10 pb-4 text-center">
            <div className="w-16 h-16 bg-wood-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-wood-500/20">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Mueblería Cams</h1>
            <p className="text-sm text-white/50 mt-1 font-body">Sistema de Gestión de Inventario</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider font-body">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-wood-500/40 focus:border-wood-500/50 transition-all font-body"
                placeholder="Ingrese su usuario"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider font-body">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-wood-500/40 focus:border-wood-500/50 transition-all font-body"
                  placeholder="Ingrese su contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm px-4 py-2.5 rounded-lg animate-slideDown font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wood-500 hover:bg-wood-600 text-white py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-wood-500/20 font-body"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6 font-body">© {new Date().getFullYear()} Mueblería Cams · Todos los derechos reservados</p>
      </div>
    </div>
  );
}
