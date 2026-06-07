import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_BASE ?? 'http://localhost:4000';

interface LoginProps {
  onLogin: (username: string, role: 'admin' | 'dentist' | 'receptionist') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.message || 'Falha ao autenticar');
        setLoading(false);
        return;
      }

      const token = body.token ?? body?.data?.token;
      const user = body.user ?? body?.data?.user ?? {};

      let role = (user.type as string) || (user.role as string) || (body.role as string) || 'receptionist';
      if (!['admin', 'dentist', 'receptionist'].includes(role)) {
        if (role === 'user' || role === 'reception') role = 'receptionist';
        else if (role === 'doctor') role = 'dentist';
        else role = 'receptionist';
      }

      const displayName = user.name || user.username || username;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username: displayName, role }));
      }

      onLogin(displayName, role as 'admin' | 'dentist' | 'receptionist');
    } catch (err: any) {
      setError(err?.message || 'Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8" >
          <div id= 'logo'>
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
  width="100pt" height="100pt" viewBox="0 0 1254.000000 1254.000000"
 preserveAspectRatio="xMidYMid meet" >

<g transform="translate(0.000000,1254.000000) scale(0.1,-0.1)"
fill="#003F7F" stroke="none">
<path d="M5890 12400 c-63 -5 -180 -16 -260 -25 -1188 -132 -2334 -642 -3268
-1452 -161 -141 -476 -460 -610 -620 -487 -580 -849 -1217 -1100 -1933 -173
-493 -278 -973 -328 -1495 -21 -220 -24 -818 -6 -1030 41 -464 131 -916 267
-1351 229 -725 603 -1401 1120 -2024 156 -189 553 -587 730 -734 951 -790
2070 -1268 3269 -1398 292 -32 879 -32 1171 0 845 92 1602 335 2341 753 1357
766 2390 2074 2819 3569 295 1032 313 2125 51 3166 -371 1473 -1249 2736
-2481 3570 -820 555 -1717 880 -2730 990 -175 18 -803 27 -985 14z m1983
-2214 c114 -29 264 -97 351 -160 79 -57 199 -183 257 -271 175 -264 250 -582
236 -1000 -13 -404 -92 -687 -350 -1265 -168 -376 -222 -519 -272 -720 -46
-183 -58 -283 -59 -500 0 -217 5 -278 59 -675 58 -430 71 -654 55 -935 -27
-480 -127 -887 -326 -1340 -158 -359 -379 -692 -524 -789 -123 -82 -216 -77
-311 18 -89 89 -126 218 -136 476 -9 220 1 307 112 1050 46 304 55 498 31 640
-40 233 -139 428 -264 520 -70 52 -143 76 -252 84 l-95 7 59 18 c86 27 211 19
290 -17 207 -95 361 -330 427 -650 27 -136 27 -448 -1 -772 -47 -533 -52 -641
-41 -776 12 -143 31 -269 40 -269 11 0 148 213 209 325 186 342 334 753 446
1235 110 480 136 826 101 1370 -19 296 -19 650 0 810 29 248 67 407 210 886
186 617 228 830 228 1144 0 453 -98 774 -297 975 -123 125 -288 203 -477 228
-78 10 -96 9 -174 -11 -108 -26 -186 -72 -318 -184 -299 -253 -412 -331 -559
-388 -64 -25 -225 -57 -235 -47 -2 2 32 24 74 49 143 83 264 204 449 450 243
322 385 438 617 503 83 24 316 14 440 -19z m-2894 -27 c100 -25 256 -103 356
-177 94 -70 232 -211 330 -336 205 -263 326 -393 449 -486 149 -113 336 -199
520 -240 62 -14 94 -25 85 -30 -44 -24 -183 -44 -314 -44 -198 -1 -337 33
-518 126 -121 62 -209 125 -396 281 -316 264 -438 327 -633 327 -249 0 -501
-165 -627 -410 -78 -152 -104 -271 -103 -480 1 -264 54 -527 246 -1202 102
-362 247 -884 291 -1052 l36 -140 3 -425 c3 -428 10 -545 51 -841 97 -695 368
-1456 691 -1939 l42 -63 9 58 c10 75 10 564 -1 1034 -11 476 6 660 85 905 123
377 392 637 658 634 l66 0 -60 -18 c-189 -54 -330 -188 -435 -413 -85 -182
-115 -365 -107 -638 6 -203 19 -295 97 -695 86 -440 113 -721 91 -950 -32
-356 -158 -540 -366 -539 -154 1 -264 100 -447 404 -233 386 -411 829 -517
1285 -100 432 -138 798 -128 1259 7 322 15 414 58 691 l32 200 -52 69 c-377
497 -758 1313 -885 1891 -89 405 -78 797 31 1100 170 473 570 820 1011 875 94
12 261 2 351 -21z"/>
</g>
</svg>
</div>


            <h1 className="text-2xl text-gray-900 mb-2">SaveDental</h1>
            <p className="text-sm text-gray-600">Sistema de Gestão</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-700 mb-2">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

