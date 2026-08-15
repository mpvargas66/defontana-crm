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
        // Campos básicos
        const idCliente = String(row['Id Cliente'] || '').trim();
        const nombreCliente = String(row['Nombre Cliente'] || '').trim();
        const rutCliente = String(row['Rut Cliente'] || '').trim();
        const ejecutivo = String(row['Ejecutivo PostVenta'] || '').trim();
        const fechaVencimiento = String(row['Fecha Expiración'] || '').trim();
        const totalRenovacion = parseFloat(
          String(row['Total Renovación (UF)'] || '0')
            .replace(/[^\d.]/g, '')
            .trim()
        );
        const semaforo = String(row['Semáforo'] || 'verde').trim().toLowerCase();

        // Campos nuevos
        const servicio = String(row['Servicio'] || '').trim();
        const plan = String(row['Plan'] || '').trim();
        const segmento = String(row['Segmento'] || '').trim();
        const region = String(row['Región'] || row['Region'] || '').trim();
        const cantidadEmpleados = row['Cantidad Empleados'] || row['Empleados']
          ? parseInt(String(row['Cantidad Empleados'] || row['Empleados']), 10)
          : null;
        const fechaCreacion = row['Fecha Creación'] || row['Fecha Creacion']
          ? new Date(String(row['Fecha Creación'] || row['Fecha Creacion']))
          : new Date();

        console.log(`Row: ${nombreCliente}, Servicio: ${servicio}, Plan: ${plan}, Segmento: ${segmento}`);

        if (!idCliente || !nombreCliente) {
          console.log('Saltando: Sin id o nombre');
          errors++;
          continue;
        }

        const clientResult = await pool.query(
          `INSERT INTO clientes
           (id_cliente, nombre_cliente, rut_cliente, servicio, plan, segmento, region, cantidad_empleados, fecha_creacion, es_activo, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
           ON CONFLICT (id_cliente) DO UPDATE SET
             servicio = COALESCE(EXCLUDED.servicio, clientes.servicio),
             plan = COALESCE(EXCLUDED.plan, clientes.plan),
             segmento = COALESCE(EXCLUDED.segmento, clientes.segmento),
             region = COALESCE(EXCLUDED.region, clientes.region),
             cantidad_empleados = COALESCE(EXCLUDED.cantidad_empleados, clientes.cantidad_empleados),
             updated_at = NOW()
           RETURNING id`,
          [idCliente, nombreCliente, rutCliente, servicio, plan, segmento, region, cantidadEmpleados, fechaCreacion]
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
