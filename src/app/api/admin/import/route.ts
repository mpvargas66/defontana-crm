import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

interface ImportRow {
  [key: string]: any;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

function excelBoolToBoolean(val: any): boolean {
  if (!val) return false;
  const str = String(val).trim().toLowerCase();
  return str === 'si' || str === 'yes' || str === 'true' || str === '1';
}

export async function POST(request: NextRequest) {
  console.log('========== START IMPORT ==========');
  console.log('Step 1: DATABASE_URL exists:', !!process.env.DATABASE_URL);

  try {
    console.log('Step 2: Testing connection');
    const testResult = await pool.query('SELECT NOW()');
    console.log('Step 3: Connection OK');

    console.log('Step 4: Parsing request body');
    const body = await request.json();
    console.log('Step 5: Body parsed, received rows:', body.rows?.length || 0);

    const rows = body.rows as ImportRow[];

    if (!rows || rows.length === 0) {
      console.log('Step 6: ERROR - no rows');
      return NextResponse.json({ success: false, message: 'Sin datos' }, { status: 400 });
    }

    console.log('Step 7: Starting loop with', rows.length, 'rows');
    let loaded = 0;
    let errors = 0;

    for (const row of rows) {
      console.log('Step 8: Processing row -', row['Nombre Cliente']);
      try {
        const idCliente = String(row['Id Cliente'] || '').trim();
        const nombreCliente = String(row['Nombre Cliente'] || '').trim();

        console.log('Step 9: Extracted basic fields -', nombreCliente);

        // MONTO
        let totalRenovacion = 0;
        const montoStr = String(row['Total Renovación (UF)'] || '0').trim();
        if (!isNaN(parseFloat(montoStr))) {
          totalRenovacion = parseFloat(montoStr);
        }

        // MRR
        let mrrUf = 0;
        const mrrStr = String(row['MRR (UF)'] || '0').trim();
        if (!isNaN(parseFloat(mrrStr))) {
          mrrUf = parseFloat(mrrStr);
        }

        // FECHAS (Excel)
        const convertExcelDate = (val: any) => {
          if (!val || isNaN(val)) return new Date();
          const numDate = parseFloat(val);
          return new Date((numDate - 25569) * 86400 * 1000);
        };

        const fechaVencimiento = convertExcelDate(row['Fecha Expiración']);
        const fechaCreacion = convertExcelDate(row['Fecha Creacion'] || row['Fecha Creación']);
        const ultimaConexion = convertExcelDate(row['Última Conexión']);
        const fechaTarjetaSuscrita = convertExcelDate(row['Fecha Tarjeta Suscrita']);
        const fechaInicio = convertExcelDate(row['Fecha Inicio de Servicio']);

        console.log('Step 10: Dates converted');

        // STRINGS
        const servicio = String(row['Servicio'] || '').trim();
        const plan = String(row['Plan'] || '').trim();
        const segmento = String(row['Segmento'] || '').trim();
        const region = String(row['Región'] || row['Region'] || '').trim();
        const tipoPago = String(row['Tipo de Pago'] || '').trim();
        const clienteCartera = String(row['Cliente de Cartera'] || '').trim();
        const condicion = String(row['Condición'] || row['Condicion'] || '').trim();
        const origen = String(row['Origen'] || '').trim();
        const pais = String(row['País'] || row['Pais'] || 'CL').trim();
        const idEmpresa = String(row['Id Empresa'] || '').trim();
        const rutEmpresa = String(row['Rut Empresa'] || '').trim();
        const nombreEmpresa = String(row['Nombre Empresa'] || '').trim();
        const estadoOperacion = String(row['Estado Operacion'] || '').trim();
        const estadoCliente = String(row['Estado Cliente'] || '').trim();
        const estadoClienteManual = String(row['Estado Cliente Manual'] || '').trim();
        const planSoporte = String(row['Plan Soporte'] || '').trim();
        const cuadrante = String(row['Cuadrante'] || '').trim();
        const cuadranteZenda = String(row['Cuadrante Zenda'] || '').trim();
        const numeroOt = String(row['Numero OT'] || '').trim();

        console.log('Step 11: Strings extracted');

        // BOOLEANOS
        const modular = excelBoolToBoolean(row['Modular']);
        const vigente = excelBoolToBoolean(row['Vigente']);
        const tarjetaSuscrita = excelBoolToBoolean(row['Tarjeta Suscrita']);
        const usaPos = excelBoolToBoolean(row['Usa Pos']);
        const usaTivendo = excelBoolToBoolean(row['Usa Tivendo']);
        const usaZenda = excelBoolToBoolean(row['Usa Zenda']);

        console.log('Step 12: Booleans extracted');

        const semaforo = String(row['Semáforo'] || 'verde').trim().toLowerCase();

        let cantidadEmpleados = null;
        const empStr = row['Cantidad Empleados'];
        if (empStr && !isNaN(empStr)) {
          cantidadEmpleados = parseInt(empStr, 10);
        }

        console.log('Step 13: All fields ready, about to validate');

        if (!idCliente || !nombreCliente) {
          console.log('Step 14: Validation failed - missing id or name');
          errors++;
          continue;
        }

        console.log('Step 15: About to insert cliente');

        let clienteId: number;
        try {
          const clientResult = await pool.query(
            `INSERT INTO clientes
             (id_cliente, nombre_cliente, rut_cliente, servicio, plan, segmento, region, cantidad_empleados,
              fecha_creacion, modular, cuadrante, tipo_pago, cliente_de_cartera, condicion, vigente,
              tarjeta_suscrita, ultima_conexion, fecha_tarjeta_suscrita, usa_pos, usa_tivendo, usa_zenda,
              origen, fecha_inicio_servicio, pais, id_empresa, rut_empresa, nombre_empresa,
              estado_operacion, estado_cliente, estado_cliente_manual, plan_soporte, cuadrante_zenda,
              es_activo, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
                     $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, true, NOW(), NOW())
             ON CONFLICT (id_cliente) DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [
              idCliente,
              nombreCliente,
              String(row['Rut Cliente'] || '').trim(),
              servicio,
              plan,
              segmento,
              region,
              cantidadEmpleados,
              fechaCreacion,
              modular,
              cuadrante,
              tipoPago,
              clienteCartera,
              condicion,
              vigente,
              tarjetaSuscrita,
              ultimaConexion,
              fechaTarjetaSuscrita,
              usaPos,
              usaTivendo,
              usaZenda,
              origen,
              fechaInicio,
              pais,
              idEmpresa,
              rutEmpresa,
              nombreEmpresa,
              estadoOperacion,
              estadoCliente,
              estadoClienteManual,
              planSoporte,
              cuadranteZenda,
            ]
          );

          clienteId = clientResult.rows[0].id;
          console.log('Step 16: Cliente inserted, ID:', clienteId);
        } catch (dbErr: any) {
          console.error('Step 16 ERROR - DB Insert failed:', {
            message: dbErr.message,
            code: dbErr.code,
            constraint: dbErr.constraint,
            detail: dbErr.detail,
          });
          throw dbErr;
        }

        // Obtén o crea ejecutivo
        const ejecutivo = String(row['Ejecutivo PostVenta'] || '').trim();
        let ejecutivoId = 1;
        if (ejecutivo) {
          const execResult = await pool.query(`SELECT id FROM usuarios WHERE nombre ILIKE $1`, [ejecutivo]);
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

        console.log('Step 17: Ejecutivo ready, about to insert renovacion');

        // INSERT RENOVACIONES con mrr_uf y numero_ot
        await pool.query(
          `INSERT INTO renovaciones
           (cliente_id, id_renovacion, fecha_vencimiento, ciclo, monto_uf, mrr_uf, ejecutivo_id,
            semaforo, estado, numero_ot, created_at, updated_at)
           VALUES ($1, $2, $3, 'mensual', $4, $5, $6, $7, 'por_contactar', $8, NOW(), NOW())
           ON CONFLICT (id_renovacion) DO NOTHING`,
          [clienteId, `${idCliente}-${Date.now()}`, fechaVencimiento, totalRenovacion, mrrUf, ejecutivoId, semaforo, numeroOt]
        );

        console.log('Step 18: Renovacion inserted');
        loaded++;
      } catch (err: any) {
        console.error('Step 18 ERROR - Row processing failed:', {
          error: err.message,
          code: err.code,
          detail: err.detail,
        });
        errors++;
      }
    }

    console.log('Step 19: Loop complete, loaded:', loaded, 'errors:', errors);
    return NextResponse.json({ success: true, loaded, errors });
  } catch (error) {
    console.error('Step 20 ERROR - Main try-catch:', error);
    return NextResponse.json({ success: false, message: 'Error en servidor' }, { status: 500 });
  }
}
