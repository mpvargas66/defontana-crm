'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportRow {
  [key: string]: any;
}

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const buffer = await selectedFile.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<ImportRow>(sheet);
    setPreview(data.slice(0, 5));
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) {
      setMessage('Selecciona un archivo válido');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessage(response.ok ? `✅ Cargados ${data.data?.insertados || 0} registros` : `❌ ${data.error || data.message}`);
      if (response.ok) {
        setFile(null);
        setPreview([]);
      }
    } catch (error) {
      setMessage('❌ Error en upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui', maxWidth: '1200px' }}>
      <h1>Importar Datos</h1>
      <p>Sube un archivo Excel con renovaciones</p>

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}
        />
      </div>

      {file && <p style={{ color: 'green', marginBottom: '20px' }}>✓ {file.name}</p>}

      {preview.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '20px', overflowX: 'auto' }}>
          <h2>Preview ({preview.length} filas)</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                {Object.keys(preview[0]).map((key) => (
                  <th key={key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, vidx) => (
                    <td key={vidx} style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {String(val).substring(0, 50)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: file && !loading ? '#0066cc' : '#ccc',
          color: 'white',
          border: 'none',
          cursor: file && !loading ? 'pointer' : 'default',
          borderRadius: '4px',
        }}
      >
        {loading ? 'Cargando...' : 'Cargar a BD'}
      </button>

      {message && <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}
