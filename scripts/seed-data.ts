import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedData() {
  try {
    const file = fs.readFileSync('./SONDA.xlsx');
    const workbook = XLSX.read(file, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`Leyendo ${data.length} registros de SONDA.xlsx`);

    for (const row of data) {
      const idCliente = row['Id Cliente'] || row['ID Cliente'] || row['id_cliente'];
      const nombreCliente = row['Nombre'] || row['nombre_cliente'];
      const rutCliente = row['Rut'] || row['RUT'];
      const ejecutivo = row['Ejecutivo PostVenta'] || row['ejecutivo'];
      const fechaVencimiento = row['Fecha Expiración'] || row['fecha_vencimiento'];
      const totalRenovacion = row['Total Renovación (UF)'] || row['monto_uf'];
      const semaforo = row['Semáforo'] || 'verde';

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
              [ejecutivo, `${ejecutivo.toLowerCase().replace(' ', '.')}@defontana.com`]
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

        console.log(`✓ Insertado: ${nombreCliente}`);
      } catch (err) {
        console.error(`Error con ${nombreCliente}:`, err);
      }
    }

    console.log('✅ Seed completado');
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedData();
