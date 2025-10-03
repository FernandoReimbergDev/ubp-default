import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../services/getDecryptedToken';
import { API_REQ_APPLICATION, ENVIRONMENT, JWT_REFRESH_SECRET, JWT_SECRET, STORE_ID } from '../../../utils/env';

export async function POST(req: NextRequest) {
    try {
        const storeId = STORE_ID;
        const { email, recoveryCode, password, confirmPassword } = await req.json();

        if (!storeId) {
            console.error('ID da plataforma não encontrado:', storeId);
            return NextResponse.json(
                { success: false, message: 'Erro ao obter ID da plataforma.' },
                { status: 500 }
            );
        }

        if (!recoveryCode) {
            return NextResponse.json(
                { success: false, message: 'Código de acesso invalido.' },
                { status: 400 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Parametros inválidos.' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { success: false, message: 'As senhas não coincidem.' },
                { status: 400 }
            );
        }

        const token = await getDecryptedToken(API_REQ_APPLICATION);

        if (!token) {
            console.error('Token não encontrado para aplicação:', API_REQ_APPLICATION);
            return NextResponse.json(
                { success: false, message: 'Erro ao obter token de autenticação.' },
                { status: 500 }
            );
        }

        const url = 'https://unitybrindes.com.br/password-recovery';

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Environment': ENVIRONMENT,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                storeId: Number(storeId),
                username: email,
                password: password,
                passwordConfirm: confirmPassword,
                passwordRecoveryCode: Number(recoveryCode)
            })
        };

        // Chamada correta com await:
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('Erro na API externa:', data);
            return NextResponse.json({ success: false, details: data }, { status: response.status });
        }


        const accessToken = jwt.sign(
            { email },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { email },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        const res = NextResponse.json({
            success: true,
            message: data.message,
        }, { status: response.status });

        res.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 15,
            sameSite: 'strict',
        });

        res.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/api/token/refresh',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'strict',
        });

        return res;
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Erro interno ao cadastrar nova senha:', err.message);
            return NextResponse.json({ success: false, message: 'Erro interno ao cadastrar nova senha', details: err.message }, { status: 500 });
        } else {
            console.error('Erro interno desconhecido ao cadastrar nova senha:', err);
            return NextResponse.json({ success: false, message: 'Erro interno desconhecido ao cadastrar nova senha' }, { status: 500 });
        }
    }
}

