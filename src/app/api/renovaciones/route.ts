import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Renovacion, ApiResponse } from '@/types';

// GET /api/renovaciones
export async function GET(request: NextRequest) {
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

    const result = await sql`SELECT * FROM renovaciones ORDER BY fecha_vencimiento ASC LIMIT 50`;

    return NextResponse.json({
      success: true,
      data: result.rows,
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

    const result = await sql`
      INSERT INTO renovaciones (
        cliente_id, fecha_vencimiento, ciclo, monto_uf, mrr_uf,
        ejecutivo_id, estado, semaforo
      )
      VALUES (
        ${cliente_id}, ${new Date(fecha_vencimiento).toISOString()}, ${ciclo},
        ${monto_uf}, ${mrr_uf}, ${ejecutivo_id}, ${estado}, ${semaforo}
      )
      RETURNING *
    `;

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
