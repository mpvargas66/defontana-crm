import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@/lib/db';
import { Usuario } from '@/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        try {
          const result = await sql.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
          );

          const usuario = result.rows[0];

          if (!usuario) return null;

          if (password !== process.env.ADMIN_PASSWORD) {
            return null;
          }

          return {
            id: usuario.id.toString(),
            email: usuario.email,
            name: usuario.nombre,
            rol: usuario.rol,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
});
