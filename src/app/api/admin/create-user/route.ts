import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const CREATE_USER_TOKEN = process.env.CREATE_USER_TOKEN || 'secret-create-user-token';

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || token !== CREATE_USER_TOKEN) {
      return NextResponse.json(
        { error: 'Token inválido o no proporcionado' },
        { status: 401 }
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Verifica si el usuario ya existe
    const checkResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      ['marco@arauko.com']
    );

    if (checkResult.rows.length > 0) {
      await pool.end();
      return NextResponse.json({
        success: false,
        message: 'User already exists',
        user: checkResult.rows[0],
      });
    }

    // Crea el usuario admin
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, rol, es_activo, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING id, nombre, email, rol`,
      ['Marco Vargas', 'marco@arauko.com', 'admin']
    );

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Admin user created',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
}
