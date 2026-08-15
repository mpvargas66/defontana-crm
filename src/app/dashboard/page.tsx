'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Renovacion, ApiResponse } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [renovaciones, setRenovaciones] = useState<Renovacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRenovaciones();
    }
  }, [status]);

  const fetchRenovaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/renovaciones');
      const data: ApiResponse<Renovacion[]> = await response.json();

      if (data.success) {
        setRenovaciones(data.data || []);
      } else {
        setError(data.error || 'Error al cargar renovaciones');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const semaforoColors: Record<string, string> = {
    verde: 'bg-green-100 text-green-800',
    amarillo: 'bg-yellow-100 text-yellow-800',
    rojo: 'bg-red-100 text-red-800',
    indeterminado: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Defontana</h1>
            <p className="text-gray-600">Renewals CRM - Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{session.user?.name}</p>
              <p className="text-sm text-gray-600">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ redirect: true })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Renovaciones</p>
            <p className="text-3xl font-bold text-gray-900">{renovaciones.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Estado: Por Contactar</p>
            <p className="text-3xl font-bold text-gray-900">
              {renovaciones.filter((r) => r.estado === 'por_contactar').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Semáforo: Rojo</p>
            <p className="text-3xl font-bold text-red-600">
              {renovaciones.filter((r) => r.semaforo === 'rojo').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Escaladas a Gerencia</p>
            <p className="text-3xl font-bold text-gray-900">
              {renovaciones.filter((r) => r.escalado_a_gerencia).length}
            </p>
          </div>
        </div>

        {/* Renovaciones Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Renovaciones</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700">
              {error}
            </div>
          )}

          {renovaciones.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No hay renovaciones registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Fecha Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Semáforo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Monto UF
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Riesgo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {renovaciones.slice(0, 10).map((renovacion) => (
                    <tr key={renovacion.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {/* Will be populated with cliente name in FASE 2 */}
                        Cliente #{renovacion.cliente_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(renovacion.fecha_vencimiento).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {renovacion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            semaforoColors[renovacion.semaforo] ||
                            semaforoColors['indeterminado']
                          }`}
                        >
                          {renovacion.semaforo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {renovacion.monto_uf
                          ? `$${
                              typeof renovacion.monto_uf === 'number'
                                ? renovacion.monto_uf.toFixed(2)
                                : parseFloat(String(renovacion.monto_uf)).toFixed(2)
                            } UF`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {renovacion.riesgo_churn_score}/10
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
