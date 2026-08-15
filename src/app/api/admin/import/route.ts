import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { ApiResponse } from '@/types';

interface ImportRow {
  [key: string]: any;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = body.rows as ImportRow[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Sin datos' }, { status: 400 });
    }

    let loaded = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        console.log('Procesando:', {
          idCliente: row['Id Cliente'] || row['ID Cliente'],
          nombreCliente: row['Nombre'],
          ejecutivo: row['Ejecutivo PostVenta'],
          monto: row['Total Renovación (UF)'],
        });

        const idCliente = String(row['Id Cliente'] || row['ID Cliente'] || '').trim();
        const nombreCliente = String(row['Nombre'] || '').trim();
        const rutCliente = String(row['Rut'] || '').trim();
        const ejecutivo = String(row['Ejecutivo PostVenta'] || '').trim();
        const fechaVencimiento = String(row['Fecha Expiración'] || '').trim();
        const totalRenovacion = parseFloat(String(row['Total Renovación (UF)'] || '0'));
        const semaforo = String(row['Semáforo'] || 'verde').trim().toLowerCase();

        if (!idCliente || !nombreCliente) {
          console.log('Saltando fila: falta idCliente o nombreCliente');
          errors++;
          continue;
        }

        const clientResult = await pool.query(
          `INSERT INTO clientes (id_cliente, nombre_cliente, rut_cliente, es_activo, created_at, updated_at)
           VALUES ($1, $2, $3, true, NOW(), NOW())
           ON CONFLICT (id_cliente) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [idCliente, nombreCliente, rutCliente]
        );

        const clienteId = clientResult.rows[0].id;

        let ejecutivoId = 1;
        if (ejecutivo) {
          const execResult = await pool.query(
            `SELECT id FROM usuarios WHERE nombre ILIKE $1`,
            [ejecutivo]
          );
          if (execResult.rows.length === 0) {
            const newExec = await pool.query(
              `INSERT INTO usuarios (nombre, email, rol)
               VALUES ($1, $2, 'operador')
               RETURNING id`,
              [ejecutivo, `${ejecutivo.toLowerCase().replace(/\s+/g, '.')}@defontana.com`]
            );
            ejecutivoId = newExec.rows[0].id;
          } else {
            ejecutivoId = execResult.rows[0].id;
          }
        }

        await pool.query(
          `INSERT INTO renovaciones
           (cliente_id, id_renovacion, fecha_vencimiento, ciclo, monto_uf, ejecutivo_id, semaforo, estado, created_at, updated_at)
           VALUES ($1, $2, $3, 'mensual', $4, $5, $6, 'por_contactar', NOW(), NOW())
           ON CONFLICT (id_renovacion) DO NOTHING`,
          [clienteId, `${idCliente}-${Date.now()}`, new Date(fechaVencimiento), totalRenovacion || 0, ejecutivoId, semaforo]
        );

        loaded++;
      } catch (err) {
        console.error('Error row:', row, err);
        errors++;
      }
    }

    return NextResponse.json({ success: true, loaded, errors });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, message: 'Error en servidor' },
      { status: 500 }
    );
  }
}
