
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

                let isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                // Legacy Werkzeug Scrypt support & auto-upgrade
                if (!isValid && user.passwordHash.startsWith('scrypt:')) {
                    try {
                        const crypto = require('crypto');
                        const [params, salt, key] = user.passwordHash.split('$');
                        const [_, nStr, rStr, pStr] = params.split(':');
                        const derivedKey = crypto.scryptSync(credentials.password, Buffer.from(salt, 'utf8'), 64, {
                            N: parseInt(nStr),
                            r: parseInt(rStr),
                            p: parseInt(pStr),
                            maxmem: 128 * 1024 * 1024
                        });

                        if (derivedKey.toString('hex') === key) {
                            isValid = true;
                            // Update to bcrypt automatically
                            const newHash = await bcrypt.hash(credentials.password, 10);
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { passwordHash: newHash }
                            });
                        }
                    } catch (e) {
                        console.error('Error verifying legacy hash', e);
                    }
                }

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
                    canCreateGarantias: (user as any).canCreateGarantias || false,
                    canManageOrders: (user as any).canManageOrders || false,
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
                session.user.image = token.image as string | null;
                session.user.canCreateGarantias = token.canCreateGarantias as boolean;
                session.user.canManageOrders = token.canManageOrders as boolean;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
                token.image = (user as any).image || undefined;
                token.canCreateGarantias = (user as any).canCreateGarantias;
                token.canManageOrders = (user as any).canManageOrders;
            }
            if (trigger === "update" && session) {
                if (session.image) token.image = session.image as string;
                if (session.name) token.name = session.name as string;
            }
            return token;
        }
    }
};
