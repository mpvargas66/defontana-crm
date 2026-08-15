import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

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
        const idCliente = String(row['Id Cliente'] || '').trim();
        const nombreCliente = String(row['Nombre Cliente'] || '').trim();
        const rutCliente = String(row['Rut Cliente'] || '').trim();
        const ejecutivo = String(row['Ejecutivo PostVenta'] || '').trim();

        // MONTO - procesar ANTES que las fechas
        let totalRenovacion = 0;
        const montoStr = String(row['Total Renovación (UF)'] || '0').trim();
        if (!isNaN(parseFloat(montoStr))) {
          totalRenovacion = parseFloat(montoStr);
        }

        // FECHAS - convertir de Excel
        const excelVencimiento = row['Fecha Expiración'];
        let fechaVencimiento = new Date();
        if (excelVencimiento && !isNaN(excelVencimiento)) {
          const numDate = parseFloat(excelVencimiento);
          fechaVencimiento = new Date((numDate - 25569) * 86400 * 1000);
        }

        const semaforo = String(row['Semáforo'] || 'verde').trim().toLowerCase();
        const servicio = String(row['Servicio'] || '').trim();
        const plan = String(row['Plan'] || '').trim();
        const segmento = String(row['Segmento'] || '').trim();
        const region = String(row['Región'] || row['Region'] || '').trim();

        let cantidadEmpleados = null;
        const empStr = row['Cantidad Empleados'];
        if (empStr && !isNaN(empStr)) {
          cantidadEmpleados = parseInt(empStr, 10);
        }

        const excelCreacion = row['Fecha Creacion'] || row['Fecha Creación'];
        let fechaCreacion = new Date();
        if (excelCreacion && !isNaN(excelCreacion)) {
          const numDate = parseFloat(excelCreacion);
          fechaCreacion = new Date((numDate - 25569) * 86400 * 1000);
        }

        console.log(`[${nombreCliente}] Monto: ${totalRenovacion}, Vence: ${fechaVencimiento}`);

        if (!idCliente || !nombreCliente) {
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
          [clienteId, `${idCliente}-${Date.now()}`, fechaVencimiento, totalRenovacion, ejecutivoId, semaforo]
        );

        loaded++;
      } catch (err) {
        console.error('Error row:', err);
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
