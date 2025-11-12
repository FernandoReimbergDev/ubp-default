"use client";

import { useCart } from "@/app/Context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Cookies from "js-cookie";

interface CartGuardProps {
  children: React.ReactNode;
  /**
   * Se true, permite acesso mesmo com carrinho vazio se houver pedidoPayload
   * (útil para página de pedido após finalização)
   */
  allowEmptyWithPayload?: boolean;
}

/**
 * Componente que protege rotas de checkout.
 * IMPORTANTE: NÃO redireciona durante o carregamento inicial (F5).
 * Só redireciona se o carrinho ficar vazio APÓS ter tido itens.
 */
export function CartGuard({ children, allowEmptyWithPayload = false }: CartGuardProps) {
  const { cart, cartReady } = useCart();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const hadItemsBefore = useRef(false);
  const initialCheckComplete = useRef(false);

  useEffect(() => {
    // Aguarda o carrinho estar pronto para fazer a primeira verificação
    if (!cartReady) {
      return;
    }

    // Primeira verificação após carrinho estar pronto
    if (!initialCheckComplete.current) {
      initialCheckComplete.current = true;
      // Marca se tinha itens na primeira verificação
      hadItemsBefore.current = cart.length > 0;
      // NÃO redireciona na primeira verificação, mesmo se vazio
      // Isso permite que o usuário dê F5 sem ser redirecionado
      return;
    }

    // Após a primeira verificação, monitora mudanças no carrinho
    // Se o carrinho tem itens, atualiza o estado
    if (cart.length > 0) {
      hadItemsBefore.current = true;
      return;
    }

    // Carrinho está vazio
    // Só redireciona se TINHA itens antes e AGORA está vazio
    // Isso significa que o carrinho foi limpo durante a navegação
    if (!hadItemsBefore.current) {
      // Nunca teve itens, não redireciona (permite F5 sem redirecionamento)
      return;
    }

    // Tinha itens antes e agora está vazio (foi limpo)
    // Verifica se pode permitir acesso com payload
    if (allowEmptyWithPayload) {
      try {
        const hasPedidoPayload =
          (typeof window !== "undefined" && localStorage.getItem("pedidoPayload")) || Cookies.get("pedidoPayload");

        if (hasPedidoPayload) {
          // Tem payload, permite acesso mesmo com carrinho vazio
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar pedidoPayload:", error);
      }
    }

    // Tinha itens, agora está vazio, e não tem payload (se necessário)
    // Redireciona apenas uma vez
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/");
    }
  }, [cart.length, cartReady, router, allowEmptyWithPayload]);

  // Renderiza normalmente
  // Durante o carregamento inicial, sempre renderiza para evitar flash
  // O redirecionamento só acontece se o carrinho foi limpo durante a navegação
  return <>{children}</>;
}
