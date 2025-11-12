"use client";

import { useCallback, useEffect, useRef } from "react";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos de inatividade
const REFRESH_INTERVAL = 10 * 60 * 1000; // Renova token a cada 10 minutos quando ativo
const ACTIVITY_DEBOUNCE = 1000; // Debounce de 1 segundo para eventos de atividade

// Eventos que indicam atividade do usuário
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "focus",
  "visibilitychange",
] as const;

export function SessionRefresher() {
  const lastActivityRef = useRef<number>(Date.now());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);

  // Função para renovar o token
  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/refresh", {
        method: "GET",
        credentials: "include", // envia os cookies
      });

      if (!res.ok) {
        console.warn("[Sessão] Falha ao renovar token.");
      }
    } catch (err) {
      console.error("[Sessão] Erro ao renovar token:", err);
    }
  }, []);

  // Função para parar o intervalo de renovação
  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Função para iniciar o intervalo de renovação
  const startRefreshInterval = useCallback(() => {
    // Limpa o intervalo anterior se existir
    stopRefreshInterval();

    // Renova imediatamente
    refreshToken();

    // Define intervalo para renovar a cada 10 minutos
    refreshIntervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        refreshToken();
      }
    }, REFRESH_INTERVAL);
  }, [refreshToken, stopRefreshInterval]);

  // Função para resetar o timer de inatividade
  const resetInactivityTimer = useCallback(() => {
    // Limpa o timeout anterior
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Se estava inativo, volta a ser ativo
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      startRefreshInterval();
    }

    // Atualiza o timestamp da última atividade
    lastActivityRef.current = Date.now();

    // Define novo timeout de inatividade (15 minutos)
    inactivityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      stopRefreshInterval();
    }, INACTIVITY_TIMEOUT);
  }, [startRefreshInterval, stopRefreshInterval]);

  // Função para detectar atividade (com debounce)
  const handleActivity = useCallback(() => {
    // Limpa o debounce anterior
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }

    // Debounce: só processa atividade após 1 segundo sem novos eventos
    activityDebounceRef.current = setTimeout(() => {
      resetInactivityTimer();
    }, ACTIVITY_DEBOUNCE);
  }, [resetInactivityTimer]);

  // Função para lidar com mudanças de visibilidade da página
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      // Página voltou a estar visível, verifica se há atividade recente
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity < INACTIVITY_TIMEOUT) {
        // Ainda dentro do período de atividade, reinicia timers
        resetInactivityTimer();
      } else {
        // Passou muito tempo, marca como inativo
        isActiveRef.current = false;
        stopRefreshInterval();
      }
    } else {
      // Página ficou oculta, para de renovar (mas mantém o timer de inatividade)
      stopRefreshInterval();
    }
  }, [resetInactivityTimer, stopRefreshInterval]);

  useEffect(() => {
    // Inicializa timers
    resetInactivityTimer();
    startRefreshInterval();

    // Adiciona listeners para eventos de atividade
    ACTIVITY_EVENTS.forEach((event) => {
      if (event === "visibilitychange") {
        document.addEventListener(event, handleVisibilityChange);
      } else {
        window.addEventListener(event, handleActivity, { passive: true });
      }
    });

    // Cleanup
    return () => {
      // Remove listeners
      ACTIVITY_EVENTS.forEach((event) => {
        if (event === "visibilitychange") {
          document.removeEventListener(event, handleVisibilityChange);
        } else {
          window.removeEventListener(event, handleActivity);
        }
      });

      // Limpa timers
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }
    };
  }, [handleActivity, handleVisibilityChange, resetInactivityTimer, startRefreshInterval]);

  return null;
}
