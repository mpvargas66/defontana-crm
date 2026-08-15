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
  const [selectedRenovacion, setSelectedRenovacion] = useState<RenovacionData | null>(null);
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

  const handleRowClick = (renovacion: RenovacionData) => {
    setSelectedRenovacion(renovacion);
  };

  const handleCloseModal = () => {
    setSelectedRenovacion(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Dashboard - Renovaciones</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Cliente</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Ejecutivo</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Vencimiento</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Monto (UF)</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Estado</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Semáforo</th>
                </tr>
              </thead>
              <tbody>
                {renovaciones.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedRenovacion?.id === r.id ? '#e8f4f8' : 'white',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {r.cliente?.nombre_cliente || 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {r.ejecutivo_nombre || 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {new Date(r.fecha_vencimiento).toLocaleDateString('es-CL')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {typeof r.monto_uf === 'number' ? r.monto_uf.toFixed(2) : 0}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {r.estado}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      <span
                        style={{
                          backgroundColor: r.semaforo === 'rojo' ? '#ffebee' : r.semaforo === 'amarillo' ? '#fff3e0' : '#e8f5e9',
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRenovacion && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                    {selectedRenovacion.cliente?.nombre_cliente}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>RUT</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.cliente?.rut_cliente || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Servicio</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.cliente?.servicio || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Plan</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.cliente?.plan || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Segmento</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.cliente?.segmento || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Región</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.cliente?.region || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Empleados</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.cliente?.cantidad_empleados || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Ejecutivo</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.ejecutivo_nombre || 'N/A'}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Vencimiento</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>
                      {new Date(selectedRenovacion.fecha_vencimiento).toLocaleDateString('es-CL')}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Monto (UF)</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>
                      {typeof selectedRenovacion.monto_uf === 'number' ? selectedRenovacion.monto_uf.toFixed(2) : 0}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Estado</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.estado}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Semáforo</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedRenovacion.semaforo}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Fecha Creación</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>
                      {selectedRenovacion.cliente?.fecha_creacion
                        ? new Date(selectedRenovacion.cliente.fecha_creacion).toLocaleDateString('es-CL')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '20px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
