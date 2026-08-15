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
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Cliente</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Servicio</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Plan</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Segmento</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Ejecutivo</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Vencimiento</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Monto (UF)</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Estado</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Semáforo</th>
                  </tr>
                </thead>
                <tbody>
                  {renovaciones.slice(0, 20).map((r: any) => (
                    <tr key={r.id}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.nombre_cliente}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.servicio || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.plan || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.segmento || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.ejecutivo_nombre}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {new Date(r.fecha_vencimiento).toLocaleDateString('es-CL')}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {typeof r.monto_uf === 'number'
                          ? r.monto_uf.toFixed(2)
                          : parseFloat(String(r.monto_uf || 0)).toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.estado}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{r.semaforo}</td>
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
