import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { auth } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT
        r.id,
        r.cliente_id,
        r.id_renovacion,
        r.fecha_vencimiento,
        r.monto_uf,
        r.ejecutivo_id,
        r.estado,
        r.semaforo,
        c.id as cliente_id,
        c.nombre_cliente,
        c.rut_cliente,
        c.servicio,
        c.plan,
        c.segmento,
        c.region,
        c.cantidad_empleados,
        c.fecha_creacion,
        u.nombre as ejecutivo_nombre
      FROM renovaciones r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN usuarios u ON r.ejecutivo_id = u.id
      ORDER BY r.fecha_vencimiento ASC
    `);

    const renovaciones = result.rows.map((row: any) => ({
      id: row.id,
      cliente_id: row.cliente_id,
      id_renovacion: row.id_renovacion,
      fecha_vencimiento: row.fecha_vencimiento,
      monto_uf: row.monto_uf,
      ejecutivo_id: row.ejecutivo_id,
      estado: row.estado,
      semaforo: row.semaforo,
      ejecutivo_nombre: row.ejecutivo_nombre,
      cliente: {
        id: row.cliente_id,
        nombre_cliente: row.nombre_cliente,
        rut_cliente: row.rut_cliente,
        servicio: row.servicio,
        plan: row.plan,
        segmento: row.segmento,
        region: row.region,
        cantidad_empleados: row.cantidad_empleados,
        fecha_creacion: row.fecha_creacion,
      },
    }));

    return NextResponse.json({ data: renovaciones, total: renovaciones.length });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error fetching renovaciones' },
      { status: 500 }
    );
  }
}
