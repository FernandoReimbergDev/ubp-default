import NextAuth from "next-auth";
import { authOptions } from "../../../services/authSSO";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
