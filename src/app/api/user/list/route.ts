import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ENVIRONMENT, STORE_ID } from "../../../utils/env";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const clienteRaw = cookieStore.get("cliente")?.value;

        let userIdFromCookie: string | undefined;
        if (clienteRaw) {
            try {
                const parsed = JSON.parse(clienteRaw);
                userIdFromCookie = String(parsed?.id ?? parsed?.userId ?? "");
            } catch { }
        }

        console.log(userIdFromCookie, ENVIRONMENT, STORE_ID)


        const res = await fetch("/api/send-request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                reqMethod: "GET",
                reqEndpoint: "/list-users",
                reqHeaders: {
                    "X-Environment": ENVIRONMENT,
                    storeId: STORE_ID,
                    userIsActive: "1",
                    userIsDeleted: "0",
                    userId: userIdFromCookie
                },
            }),
        });

        const result = await res.json();

        // if (!res.ok) {
        //     throw new Error(result.message || "Erro ao buscar produtos");
        // }

        const data = await res.json();
        console.log(data)
        return NextResponse.json({
            success: true,
            user: result.data.result,
        });

    } catch (e) {
        return NextResponse.json({ success: false, message: "Falha ao obter usuário" }, { status: 500 });
    }
}