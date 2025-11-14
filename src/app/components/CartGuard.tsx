"use client";

import { useCart } from "@/app/Context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Cookies from "js-cookie";

interface CartGuardProps {
  children: React.ReactNode;
  /**
   * Se true, permite acesso mesmo com carrinho vazio se houver orderNumber
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

    // Se allowEmptyWithPayload está ativo, SEMPRE verifica orderNumber primeiro
    // Isso garante que mesmo se o carrinho foi limpo, ainda permite acesso se houver orderNumber
    if (allowEmptyWithPayload) {
      try {
        const hasOrderNumber = Cookies.get("orderNumber");
        if (hasOrderNumber) {
          // Tem orderNumber, permite acesso mesmo com carrinho vazio
          // Reseta os flags para evitar redirecionamento
          hadItemsBefore.current = false;
          hasRedirected.current = false;
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar orderNumber:", error);
      }
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

    // Tinha itens, agora está vazio, e não tem orderNumber (se allowEmptyWithPayload)
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
