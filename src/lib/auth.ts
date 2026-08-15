import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from './db';
import { Usuario } from '@/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'marco@arauko.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y password requeridos');
        }

        const { email, password } = credentials;

        // Admin account hardcoded (development only)
        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: '1',
            name: 'Marco Vargas',
            email: process.env.ADMIN_EMAIL || '',
            role: 'admin',
          };
        }

        // Query DB for user
        try {
          const usuario = await sql`SELECT * FROM usuarios WHERE email = ${email}`;

          if (!usuario.length) {
            throw new Error('Usuario no encontrado');
          }

          const userData = usuario[0] as Usuario;

          // In production, compare hashed password
          // For now, simplified auth
          return {
            id: userData.id.toString(),
            name: userData.nombre,
            email: userData.email,
            role: userData.rol,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Error de autenticación');
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
