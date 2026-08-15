'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface ImportRow {
  [key: string]: any;
}

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      complete: (results) => {
        setPreview((results.data || []).slice(0, 5) as ImportRow[]);
      },
      error: (error: any) => {
        setMessage(`❌ Error: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Selecciona un archivo');
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
      setMessage(response.ok ? `✅ Cargados ${data.data?.insertados || 0}` : `❌ ${data.error || data.message}`);
    } catch (error) {
      setMessage('❌ Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>Importar Datos</h1>

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ padding: '10px', fontSize: '16px' }}
        />
      </div>

      {file && <p style={{ color: 'green' }}>✓ {file.name}</p>}

      {preview.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h2>Preview</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                {Object.keys(preview[0]).map((key) => (
                  <th key={key} style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, idx) => (
                    <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}>
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
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: file && !loading ? '#0066cc' : '#ccc',
          color: 'white',
          border: 'none',
          cursor: file && !loading ? 'pointer' : 'default',
          borderRadius: '4px',
        }}
      >
        {loading ? 'Cargando...' : 'Cargar a BD'}
      </button>

      {message && <p style={{ marginTop: '20px', fontSize: '16px' }}>{message}</p>}
    </div>
  );
}
