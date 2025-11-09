"use client";
import { ChevronDown, ChevronUp, Headset, ListChecks, Lock, UserRoundCog } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../Context/AuthContext";
import { useState } from "react";

export default function MenuNav() {
  const { signOut, hasAnyRole } = useAuth();
  const [dropdownAdm, setDropdownAdm] = useState(false);
  const [dropdownMais, setDropdownMais] = useState(false);

  function handleOpenDropDown(menuSet: React.Dispatch<React.SetStateAction<boolean>>, menuState: boolean) {
    menuSet(!menuState);
  }

  return (
    <ul className="flex flex-col xl:flex-row xl:items-center items-start py-4 gap-4 mr-4 font-semibold text-MenuNav-text text-sm bg-Header-bg h-full">
      <Link href="/produtos">Produtos</Link>

      {hasAnyRole(["Administrador"]) && (
        <div className="group relative bg-Header-bg">
          <span>
            <span
              className="flex items-center cursor-pointer select-none"
              onClick={() => {
                handleOpenDropDown(setDropdownAdm, dropdownAdm);
              }}
            >
              Administração {!dropdownAdm ? <ChevronDown className="xl:hidden" /> : <ChevronUp className="xl:hidden" />}
            </span>
            <div
              className={`xl:max-h-0 overflow-hidden xl:shadow-xl xl:absolute top-0 group-hover:xl:max-h-[500px] transition-all duration-500 xl:transition-none ${
                !dropdownAdm ? "max-h-0" : "max-h-96 py-4"
              } xl:py-0`}
            >
              <div className="bg-Header-bg transition-height overflow-hidden duration-300 ease-in-out px-4 xl:py-4 xl:mt-[3rem] lg:w-fit text-nowrap flex flex-col gap-4 rounded">
                <Link
                  href="/estoque/consulta"
                  className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
                >
                  Consulta estoque
                </Link>
                <Link
                  href="/relatorio/produto-disponibilidade"
                  className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
                >
                  Disponibilidade Produto
                </Link>
                <Link href="/administracao/pedido-confirmado" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Pedidos
                </Link>
                <Link href="/administracao/pedido-aprovacao" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Pedidos Aprovar
                </Link>
                <Link href="/" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Produto Solicitações Disponibilidade
                </Link>
                <Link href="/" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Relatório Vendas
                </Link>
                <Link href="/" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Relatório Vendas Produtos
                </Link>
                <Link href="/" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Usuário cadastrados
                </Link>
                <Link
                  href="/adicionar-usuario"
                  className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
                >
                  Adicionar usuário
                </Link>
                <Link href="/" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                  Usuários importar
                </Link>
                <Link
                  href="/gerenciar-banner"
                  className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
                >
                  Editar Banner
                </Link>
              </div>
            </div>
          </span>
        </div>
      )}

      <div className="group relative">
        <span>
          <span
            className="flex gap-2 items-center cursor-pointer select-none"
            onClick={() => {
              handleOpenDropDown(setDropdownMais, dropdownMais);
            }}
          >
            Mais opções {!dropdownMais ? <ChevronDown className="xl:hidden" /> : <ChevronUp className="xl:hidden" />}
          </span>
          <div
            className={`xl:max-h-0 overflow-hidden xl:shadow-xl xl:absolute top-0 group-hover:xl:max-h-[500px] transition-all duration-500 xl:transition-none ${
              !dropdownMais ? "max-h-0 py-0" : "max-h-96 py-4"
            } xl:py-0`}
          >
            <div className="bg-Header-bg transition-height xl:py-4 overflow-hidden duration-300 ease-in-out px-4 xl:mt-[3rem] lg:w-fit text-nowrap flex flex-col gap-4 xl:shadow-lg rounded">
              <Link href="/meus-dados" className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer">
                <UserRoundCog />
                Meus Dados
              </Link>
              <Link
                href="/meus-pedidos"
                className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
              >
                <ListChecks />
                Meus Pedidos
              </Link>
              <Link
                href="/fale-conosco"
                className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
              >
                <Headset />
                Fale Conosco
              </Link>
              {/* Botão de logout */}
              <button
                onClick={() => signOut()}
                className="flex gap-2 items-center hover:text-MenuNav-textHover cursor-pointer"
              >
                <Lock />
                Sair
              </button>
            </div>
          </div>
        </span>
      </div>
    </ul>
  );
}
