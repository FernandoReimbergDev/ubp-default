// Utilitário simples de localStorage (sem cookies)

export function loadCartStorage(key: string): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        return localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
}

export function saveCartStorage(key: string, valueJson: string): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key, valueJson);
    } catch {
        // sem throw para não quebrar a UI
    }
}

export function removeCartStorage(key: string): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(key);
    } catch {
        // noop
    }
}
