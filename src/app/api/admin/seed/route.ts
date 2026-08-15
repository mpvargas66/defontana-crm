import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { ApiResponse } from '@/types';

const SEED_TOKEN = process.env.SEED_TOKEN || 'secret-seed-token';

interface SondaRow {
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || token !== SEED_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o no proporcionado' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL no configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Leer archivo SONDA.xlsx desde public/data/
    const filePath = './public/data/SONDA.xlsx';

    if (!fs.existsSync(filePath)) {
      await pool.end();
      return NextResponse.json(
        { success: false, error: 'Archivo SONDA.xlsx no encontrado en public/data/' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const file = fs.readFileSync(filePath);
    const workbook = XLSX.read(file, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<SondaRow>(sheet);

    console.log(`Seeding: Leyendo ${data.length} registros de SONDA.xlsx`);

    let insertados = 0;
    let errores = 0;

    for (const row of data) {
      const idCliente = (row['Id Cliente'] || row['ID Cliente'] || row['id_cliente']) as string;
      const nombreCliente = (row['Nombre'] || row['nombre_cliente']) as string;
      const rutCliente = (row['Rut'] || row['RUT']) as string;
      const ejecutivo = (row['Ejecutivo PostVenta'] || row['ejecutivo']) as string;
      const fechaVencimiento = (row['Fecha Expiración'] || row['fecha_vencimiento']) as string;
      const totalRenovacion = (row['Total Renovación (UF)'] || row['monto_uf']) as number;
      const semaforo = (row['Semáforo'] || 'verde') as string;

      if (!idCliente || !nombreCliente) continue;

      try {
        // Inserta o actualiza cliente
        const clientResult = await pool.query(
          `INSERT INTO clientes (id_cliente, nombre_cliente, rut_cliente, es_activo, created_at, updated_at)
           VALUES ($1, $2, $3, true, NOW(), NOW())
           ON CONFLICT (id_cliente) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [idCliente, nombreCliente, rutCliente]
        );

        const clienteId = clientResult.rows[0].id;

        // Obtén ejecutivo o crea uno
        let ejecutivoId = 1;
        if (ejecutivo) {
          const execResult = await pool.query(
            `SELECT id FROM usuarios WHERE nombre = $1`,
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

        // Inserta renovación
        await pool.query(
          `INSERT INTO renovaciones
           (cliente_id, id_renovacion, fecha_vencimiento, ciclo, monto_uf, ejecutivo_id, semaforo, estado, created_at, updated_at)
           VALUES ($1, $2, $3, 'mensual', $4, $5, $6, 'por_contactar', NOW(), NOW())
           ON CONFLICT (id_renovacion) DO NOTHING`,
          [clienteId, `${idCliente}-${Date.now()}`, new Date(fechaVencimiento), totalRenovacion || 0, ejecutivoId, semaforo]
        );

        insertados++;
      } catch (err) {
        console.error(`Error con ${nombreCliente}:`, err);
        errores++;
      }
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      message: `Seed completado: ${insertados} insertados, ${errores} errores`,
      data: { insertados, errores, total: data.length },
    } as ApiResponse<unknown>);
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json(
      { success: false, error: 'Error al ejecutar seed' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
