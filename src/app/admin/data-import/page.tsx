'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ImportData {
  [key: string]: any;
}

interface ImportResult {
  success: boolean;
  message?: string;
  insertados?: number;
  errores?: number;
  total?: number;
  error?: string;
}

const REQUIRED_COLUMNS = [
  'Id Cliente',
  'Nombre',
  'Rut',
  'Ejecutivo PostVenta',
  'Fecha Expiración',
  'Total Renovación (UF)',
  'Semáforo',
];

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    setError('');
    setResult(null);

    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedData = XLSX.utils.sheet_to_json<ImportData>(sheet);

        // Validar columnas
        if (parsedData.length === 0) {
          setError('El archivo está vacío');
          setLoading(false);
          return;
        }

        const firstRow = parsedData[0];
        const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setError(`Columnas faltantes: ${missingColumns.join(', ')}`);
          setLoading(false);
          return;
        }

        setData(parsedData);
        setLoading(false);
      } catch (err) {
        setError('Error al leer el archivo Excel');
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || data.length === 0) return;

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (result.success) {
        setResult(result);
        setData([]);
        setFile(null);
      } else {
        setError(result.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError('Error al enviar archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Importar Datos</h1>
        <p className="text-gray-600 mb-8">Sube un archivo Excel con datos de renovaciones</p>

        {/* Upload Area */}
        <motion.div
          className={clsx(
            'border-2 border-dashed rounded-lg p-8 mb-8 transition-colors text-center cursor-pointer',
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-12l-4-4m0 0l-4 4m4-4v16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">
              {file ? file.name : 'Arrastra un archivo Excel aquí'}
            </p>
            <p className="text-sm text-gray-500 mt-2">o haz clic para seleccionar</p>
          </label>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* Success */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-8"
          >
            <p className="font-medium">✅ {result.message}</p>
            {result.insertados !== undefined && (
              <>
                <p className="text-sm mt-2">Insertados: {result.insertados}</p>
                <p className="text-sm">Errores: {result.errores}</p>
                <p className="text-sm">Total: {result.total}</p>
              </>
            )}
          </motion.div>
        )}

        {/* Preview Table */}
        {data.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Vista previa ({data.length} registros)
            </h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">RUT</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Ejecutivo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha Exp.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Monto UF</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semáforo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{row['Nombre']}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row['Rut']}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row['Ejecutivo PostVenta']}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(row['Fecha Expiración']).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row['Total Renovación (UF)']}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          {
                            'bg-green-100 text-green-800': row['Semáforo'] === 'verde',
                            'bg-yellow-100 text-yellow-800': row['Semáforo'] === 'amarillo',
                            'bg-red-100 text-red-800': row['Semáforo'] === 'rojo',
                            'bg-gray-100 text-gray-800': !['verde', 'amarillo', 'rojo'].includes(row['Semáforo']),
                          }
                        )}>
                          {row['Semáforo']}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
                  ... y {data.length - 5} registros más
                </div>
              )}
            </div>

            {/* Upload Button */}
            <motion.button
              onClick={handleUpload}
              disabled={uploading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                'mt-6 px-6 py-3 rounded-lg font-medium transition-colors',
                uploading
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              )}
            >
              {uploading ? 'Cargando...' : `Cargar ${data.length} registros`}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
