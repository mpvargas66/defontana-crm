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

        // Demo: allow marco@arauko.com with dev123
        if (email === 'marco@arauko.com' && password === 'dev123') {
          return {
            id: '1',
            email: 'marco@arauko.com',
            name: 'Marco Vargas',
            rol: 'admin',
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
});
