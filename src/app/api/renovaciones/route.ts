import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Renovacion, ApiResponse } from '@/types';

// GET /api/renovaciones
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get('estado');
    const semaforo = searchParams.get('semaforo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db`
      SELECT
        r.id, r.cliente_id, r.id_renovacion, r.fecha_vencimiento,
        r.fecha_creacion, r.ciclo, r.monto_uf, r.mrr_uf, r.ejecutivo_id,
        r.estado, r.semaforo, r.riesgo_churn_score, r.estado_operacion,
        r.tipo_pago, r.tarjeta_suscrita, r.requiere_follow_up,
        r.escalado_a_gerencia, r.created_at, r.updated_at,
        c.nombre_cliente, u.nombre as ejecutivo_nombre
      FROM renovaciones r
      JOIN clientes c ON r.cliente_id = c.id
      JOIN usuarios u ON r.ejecutivo_id = u.id
      WHERE 1=1
    `;

    if (estado) query = db`${query} AND r.estado = ${estado}`;
    if (semaforo) query = db`${query} AND r.semaforo = ${semaforo}`;

    query = db`${query} ORDER BY r.fecha_vencimiento ASC LIMIT ${limit} OFFSET ${offset}`;

    const renovaciones = await query;

    return NextResponse.json({
      success: true,
      data: renovaciones,
    } as ApiResponse<unknown>);
  } catch (error) {
    console.error('GET /api/renovaciones error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener renovaciones' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/renovaciones
export async function POST(request: NextRequest) {
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

    const result = await db<Renovacion>`
      INSERT INTO renovaciones (
        cliente_id, fecha_vencimiento, ciclo, monto_uf, mrr_uf,
        ejecutivo_id, estado, semaforo
      )
      VALUES (
        ${cliente_id}, ${new Date(fecha_vencimiento)}, ${ciclo},
        ${monto_uf}, ${mrr_uf}, ${ejecutivo_id}, ${estado}, ${semaforo}
      )
      RETURNING *
    `;

    return NextResponse.json(
      { success: true, data: result[0] } as ApiResponse<Renovacion>,
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
