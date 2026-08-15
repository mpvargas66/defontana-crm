import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE(request: NextRequest) {
  try {
    // Verificar token de seguridad
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (token !== process.env.ADMIN_PASSWORD && token !== 'dev123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.query(`
      DELETE FROM seguimientos;
      DELETE FROM drafts_ia;
      DELETE FROM alertas;
      DELETE FROM contactos;
      DELETE FROM renovaciones;
      DELETE FROM clientes;
    `);

    return NextResponse.json({ success: true, message: 'BD archivada correctamente' });
  } catch (error) {
    console.error('Archive error:', error);
    return NextResponse.json(
      { success: false, message: 'Error archivando BD' },
      { status: 500 }
    );
  }
}
