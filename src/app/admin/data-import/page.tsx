'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

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
    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target?.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<ImportRow>(sheet);
      setPreview(data.slice(0, 5));
    };
    reader.readAsBinaryString(selectedFile);
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
      if (response.ok) {
        setMessage(`✅ Cargados ${data.data?.insertados || 0} registros`);
      } else {
        setMessage(`❌ Error: ${data.error || data.message}`);
      }
    } catch (error) {
      setMessage('Error en upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Importar Datos</h1>
        <p className="text-gray-600 mb-8">Sube un archivo Excel con renovaciones</p>

        <motion.div
          className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50 mb-8"
          whileHover={{ scale: 1.02 }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full"
          />
          {file && <p className="mt-4 text-green-600">✓ {file.name}</p>}
        </motion.div>

        {preview.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Preview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="border p-2 text-left">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border">
                      {Object.values(row).map((val, idx) => (
                        <td key={idx} className="border p-2">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Cargar a BD'}
        </button>

        {message && (
          <motion.p
            className="mt-4 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
}
