
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            username: string;
            canCreateGarantias?: boolean;
            canManageOrders?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        username: string;
        canCreateGarantias?: boolean;
        canManageOrders?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        username?: string;
        image?: string;
        canCreateGarantias?: boolean;
        canManageOrders?: boolean;
    }
}
