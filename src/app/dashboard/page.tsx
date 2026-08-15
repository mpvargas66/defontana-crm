'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ClienteData {
  id: number;
  nombre_cliente: string;
  rut_cliente: string;
  servicio: string;
  plan: string;
  segmento: string;
  region: string;
  cantidad_empleados: number;
  fecha_creacion: string;
}

interface RenovacionData {
  id: number;
  cliente_id: number;
  id_renovacion: string;
  fecha_vencimiento: string;
  monto_uf: number;
  ejecutivo_id: number;
  estado: string;
  semaforo: string;
  ejecutivo_nombre: string;
  cliente: ClienteData;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [renovaciones, setRenovaciones] = useState<RenovacionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRenovaciones = async () => {
      try {
        const response = await fetch('/api/renovaciones');
        const data = await response.json();
        setRenovaciones(data.data || []);
      } catch (error) {
        console.error('Error fetching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRenovaciones();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Dashboard - Renovaciones (Total: {renovaciones.length})</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1600px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0066cc', color: 'white', position: 'sticky', top: 0 }}>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '200px' }}>
                  Cliente
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '120px' }}>
                  RUT
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '120px' }}>
                  Servicio
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '120px' }}>
                  Plan
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '100px' }}>
                  Segmento
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '150px' }}>
                  Región
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '80px' }}>
                  Empleados
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '140px' }}>
                  Ejecutivo
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '120px' }}>
                  Vencimiento
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '100px' }}>
                  Monto (UF)
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '130px' }}>
                  Estado
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '100px' }}>
                  Semáforo
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', minWidth: '140px' }}>
                  Creación
                </th>
              </tr>
            </thead>
            <tbody>
              {renovaciones.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <strong>{r.cliente?.nombre_cliente || 'N/A'}</strong>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.cliente?.rut_cliente || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.cliente?.servicio || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.cliente?.plan || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.cliente?.segmento || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.cliente?.region || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                    {r.cliente?.cantidad_empleados || '0'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.ejecutivo_nombre || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {new Date(r.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                    {typeof r.monto_uf === 'number' ? r.monto_uf.toFixed(2) : '0.00'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.estado}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <span
                      style={{
                        backgroundColor:
                          r.semaforo === 'rojo' ? '#ffebee' : r.semaforo === 'amarillo' ? '#fff3e0' : '#e8f5e9',
                        color: r.semaforo === 'rojo' ? '#c62828' : r.semaforo === 'amarillo' ? '#e65100' : '#2e7d32',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {r.semaforo}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {r.cliente?.fecha_creacion ? new Date(r.cliente.fecha_creacion).toLocaleDateString('es-CL') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
