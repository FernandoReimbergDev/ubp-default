'use client';

import { useEffect } from 'react';

export function SessionRefresher() {
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/api/refresh', {
                method: 'GET',
                credentials: 'include', // envia os cookies
            }).then((res) => {
                if (!res.ok) {
                    console.warn('[Sessão] Falha ao renovar token.');
                }
            }).catch(err => {
                console.error('[Sessão] Erro ao renovar token:', err);
            });
        }, 5 * 60 * 1000); // A cada 5 minutos

        return () => clearInterval(interval);
    }, []);

    return null;
}
