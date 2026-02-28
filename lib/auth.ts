
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Credenciales requeridas");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        username: credentials.username
                    }
                });

                if (!user) {
                    throw new Error("Usuario no encontrado");
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error("Contraseña incorrecta");
                }

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    username: user.username,
                    image: user.profileImage,
                };
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.username = token.username as string;
                session.user.image = token.image as string;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
                token.image = user.image;
            }
            if (trigger === "update") {
                if (session?.image) token.image = session.image;
                if (session?.name) token.name = session.name;
            }
            return token;
        }
    }
};
