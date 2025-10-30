import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_REQ_APPLICATION, STORE_ID, ENVIRONMENT, JWT_SECRET, JWT_REFRESH_SECRET } from '../../../utils/env';
import { getDecryptedToken } from '../../../services/getDecryptedToken'
import { SignJWT } from 'jose';
import { encrypt } from '../../../services/cryptoCookie';

export async function POST(req: NextRequest) {
    try {
        const storeId = STORE_ID;
        const { userName, accessCode, password, confirmPassword } = await req.json();

        console.log(userName, accessCode, password, confirmPassword)

        if (!storeId) {
            console.error('ID da plataforma não encontrado:', storeId);
            return NextResponse.json(
                { success: false, message: 'Erro ao obter ID da plataforma.' },
                { status: 500 }
            );
        }

        if (!accessCode) {
            return NextResponse.json(
                { success: false, message: 'Código de acesso invalido.' },
                { status: 400 }
            );
        }

        if (!userName || !password) {
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

        const url = 'https://unitybrindes.com.br/authenticate-first-access';

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Environment': ENVIRONMENT,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                storeId: Number(storeId),
                username: userName,
                accessCode: accessCode,
                password: password,
                passwordConfirm: confirmPassword
            })
        };

        // Chamada correta com await:
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('Erro na API externa:', data);
            return NextResponse.json({ success: false, details: data }, { status: response.status });
        }


        // Extrair roles e payload de usuário como no login
        const result = (data as any)?.result ?? {};
        const rawRoles: unknown = result?.role ?? result?.roles ?? result?.rules ?? [];
        const rolesFromApi: string[] = Array.isArray(rawRoles)
            ? rawRoles
                .map((r: unknown) => {
                    if (typeof r === 'string') return r;
                    if (r && typeof r === 'object' && 'name' in (r as any) && typeof (r as any).name === 'string') {
                        return (r as any).name as string;
                    }
                    return undefined;
                })
                .filter((v: unknown): v is string => typeof v === 'string')
            : [];

        const user = {
            id: result?.id,
            firstName: result?.firstName || result?.name || 'Usuário',
            role: rolesFromApi,
        };

        // Gerar tokens idênticos ao login
        const accessSecret = new TextEncoder().encode(JWT_SECRET);
        const accessToken = await new SignJWT({ sub: user.id, iss: 'unitybrindes', role: rolesFromApi })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setExpirationTime('15m')
            .sign(accessSecret);

        const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);
        const refreshToken = await new SignJWT(user)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(refreshSecret);
        const encryptedRefreshToken = encrypt(refreshToken);

        // Resposta e cookies alinhados ao login
        const res = new NextResponse(JSON.stringify({ success: true, user }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

        res.cookies.set('auth', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 15,
            sameSite: 'lax',
        });

        res.cookies.set('refreshToken', encryptedRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
        });

        return res;
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Erro interno ao cadastrar senha:', err.message);
            return NextResponse.json({ success: false, message: 'Erro interno ao cadastrar nova senha', details: err.message }, { status: 500 });
        } else {
            console.error('Erro interno desconhecido ao fazer login:', err);
            return NextResponse.json({ success: false, message: 'Erro interno desconhecido ao cadastrar nova senha' }, { status: 500 });
        }
    }
}

