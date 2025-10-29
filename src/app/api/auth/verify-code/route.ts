import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_REQ_APPLICATION, STORE_ID, ENVIRONMENT } from '../../../utils/env';
import { getDecryptedToken } from '../../../services/getDecryptedToken'

export async function POST(req: NextRequest) {
    try {
        const storeId = STORE_ID;
        const { username, accessCode } = await req.json();

        if (!storeId) {
            console.error('ID da plataforma não encontrado:', storeId);
            return NextResponse.json(
                { success: false, message: 'Erro ao obter ID da plataforma.' },
                { status: 500 }
            );
        }

        if (!username) {
            return NextResponse.json(
                { success: false, message: 'usuario inválido.' },
                { status: 400 }
            );
        }

        if (!accessCode || isNaN(Number(accessCode))) {
            return NextResponse.json(
                { success: false, message: 'Código de recuperação inválido.' },
                { status: 400 }
            );
        }

        console.log("storeId:", storeId, "username:", username, "accessCode:", accessCode)

        const token = await getDecryptedToken(API_REQ_APPLICATION);

        if (!token) {
            console.error('Token não encontrado para aplicação:', API_REQ_APPLICATION);
            return NextResponse.json(
                { success: false, message: 'Erro ao obter token de autenticação.' },
                { status: 500 }
            );
        }

        const url = 'https://unitybrindes.com.br/authenticate-validade-code';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Environment': ENVIRONMENT,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                storeId: Number(storeId),
                username: username,
                accessCode: accessCode
            })
        };

        // Chamada correta com await:
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('Erro na API externa:', data);
            return NextResponse.json({ success: false, details: data }, { status: response.status });
        }
        return NextResponse.json({
            success: true,
            status: "awaiting-password",
            message: data.message
        }, { status: response.status });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Erro interno ao fazer login:', err.message);
            return NextResponse.json({ success: false, message: 'Erro interno ao validar codigo', details: err.message }, { status: 500 });
        } else {
            console.error('Erro interno desconhecido ao fazer login:', err);
            return NextResponse.json({ success: false, message: 'Erro interno desconhecido ao validar codigo' }, { status: 500 });
        }
    }
}

