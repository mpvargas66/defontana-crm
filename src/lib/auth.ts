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

        try {
          const rows = await sql<Usuario[]>`
            SELECT * FROM usuarios WHERE email = ${credentials.email}
          `;

          const usuario = rows[0];

          if (!usuario) return null;

          // Check password (en producción, usar bcrypt)
          if (credentials.password !== process.env.ADMIN_PASSWORD) {
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
