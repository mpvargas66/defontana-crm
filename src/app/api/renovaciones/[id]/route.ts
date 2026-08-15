import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Renovacion, ApiResponse } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      'estado',
      'semaforo',
      'riesgo_churn_score',
      'estado_operacion',
      'tipo_pago',
      'tarjeta_suscrita',
      'requiere_follow_up',
      'escalado_a_gerencia',
      'monto_uf',
      'mrr_uf',
    ];

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos válidos para actualizar' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Build dynamic UPDATE query
    const setClauses = Object.entries(updates).map(([key, value]) => `${key} = ${value}`);
    const updateQuery = `UPDATE renovaciones SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ${id} RETURNING *`;

    const result = await db.query<Renovacion>(updateQuery);

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Renovación no encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    } as ApiResponse<Renovacion>);
  } catch (error) {
    console.error('PATCH /api/renovaciones/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar renovación' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await db<Renovacion>`
      SELECT *
      FROM renovaciones
      WHERE id = ${parseInt(id)}
    `;

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Renovación no encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    } as ApiResponse<Renovacion>);
  } catch (error) {
    console.error('GET /api/renovaciones/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener renovación' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
