import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/renovaciones
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
        c.id as cliente_id_full,
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
      nombre_cliente: row.nombre_cliente,
      rut_cliente: row.rut_cliente,
      servicio: row.servicio,
      plan: row.plan,
      segmento: row.segmento,
      region: row.region,
      cantidad_empleados: row.cantidad_empleados,
      fecha_creacion: row.fecha_creacion,
    }));

    return NextResponse.json({ success: true, data: renovaciones, total: renovaciones.length });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Error fetching renovaciones' }, { status: 500 });
  }
}

// POST /api/renovaciones
export async function POST(request: NextRequest) {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50));
  console.log('Environment keys:', Object.keys(process.env).filter(k => k.includes('DATABASE')));

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      cliente_id,
      fecha_vencimiento,
      ciclo,
      monto_uf,
      mrr_uf,
      ejecutivo_id,
      estado = 'por_contactar',
      semaforo = 'indeterminado',
    } = body;

    if (!cliente_id || !fecha_vencimiento || !ejecutivo_id) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cliente_id, fecha_vencimiento, ejecutivo_id' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const result = await sql.query(
      `INSERT INTO renovaciones (
        cliente_id, fecha_vencimiento, ciclo, monto_uf, mrr_uf,
        ejecutivo_id, estado, semaforo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        cliente_id,
        new Date(fecha_vencimiento).toISOString(),
        ciclo,
        monto_uf,
        mrr_uf,
        ejecutivo_id,
        estado,
        semaforo,
      ]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0] as Renovacion } as ApiResponse<Renovacion>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/renovaciones error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear renovación' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
