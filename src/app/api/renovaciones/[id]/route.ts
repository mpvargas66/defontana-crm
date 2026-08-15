import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
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
    const { estado, semaforo, riesgo_churn_score } = body;

    const result = await sql(
      `UPDATE renovaciones
       SET estado = $1, semaforo = $2, riesgo_churn_score = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [estado, semaforo, riesgo_churn_score, parseInt(id)]
    );

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Renovación no encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0] as Renovacion,
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

    const result = await sql('SELECT * FROM renovaciones WHERE id = $1', [parseInt(id)]);

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: 'Renovación no encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0] as Renovacion,
    } as ApiResponse<Renovacion>);
  } catch (error) {
    console.error('GET /api/renovaciones/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener renovación' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
