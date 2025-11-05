'use client';

import { useAuth } from "@/app/Context/AuthContext";
import { useCart } from "@/app/Context/CartContext";
import { Resumo } from "@/app/components/Resumo";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useCallback, useEffect, useMemo, useState } from "react";

type Phone = { areaCode?: string; number?: string };
type Address = {
    ibge?: string; zipcode?: string; street?: string; number?: string;
    complement?: string; neighborhood?: string; city?: string; stateCode?: string;
};

type UserShape = {
    id?: string | number;
    userId?: string | number;
    entityType?: "PF" | "PJ" | string;
    legalName?: string;
    fullName?: string;
    cpf?: string;
    cnpj?: string;
    ie?: string;
    email?: string;
    phone?: Phone;
    phones?: Phone[];
    address?: Address;
    addresses?: Address[];
};

export function SolicitarAprovacao() {
    const { hasAnyRole, fetchOrderNumber } = useAuth();
    const { cart } = useCart();
    const isAdmin = hasAnyRole(["Administrador"]);
    const router = useRouter();

    const [status, setStatus] = useState<"idle" | "confirm" | "approved" | "rejected" | "requested" | "cancelled">("idle");
    const [cancelReason, setCancelReason] = useState("");
    const [user, setUser] = useState<UserShape | null>(null);
    const [freteValido, setFreteValido] = useState(false);

    // Observa o cookie 'valorFrete' e mantém um flag local de validade
    useEffect(() => {
        const id = setInterval(() => {
            try {
                const raw = Cookies.get("valorFrete");
                const num = raw !== undefined ? Number(raw) : NaN;
                setFreteValido(Number.isFinite(num)); // aceita 0 como válido
            } catch {
                setFreteValido(false);
            }
        }, 500);
        return () => clearInterval(id);
    }, []);

    const delivery = useMemo(() => {
        // tenta ler cookie localmente como fallback
        let c: any = null;
        try {
            const raw = Cookies.get("cliente");
            c = raw ? JSON.parse(raw) : null;
        } catch { /* ignore */ }

        const cleanStr = (v: unknown) => (typeof v === "string" ? v.trim() : v);
        const nonEmpty = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";
        const pick = (...vals: any[]) => {
            for (const v of vals) {
                const t = cleanStr(v);
                if (nonEmpty(t)) return String(t);
            }
            return "";
        };
        const digits = (s: string) => s.replace(/\D+/g, "");
        const upper = (s: string) => s.toUpperCase();

        const uAddr = (user?.addresses && user.addresses[0]) || user?.address;

        const stateCode = upper(pick(
            uAddr?.stateCode,
            c?.uf,
            c?.addressState,
            c?.stateCode,
            c?.address?.stateCode,
            c?.addresses?.[0]?.stateCode,
        ));

        const city = pick(
            uAddr?.city,
            c?.addressCity,
            c?.city,
            c?.municipio,
            c?.address?.city,
            c?.addresses?.[0]?.city,
        );

        const zipCode = digits(pick(
            uAddr?.zipcode,
            c?.zipCodeBilling,
            c?.addressZip,
            c?.zipcode,
            c?.cep,
            c?.address?.zipcode,
            c?.addresses?.[0]?.zipcode,
        ));

        return { stateCode, city, zipCode };
    }, [user]);

    // -------- Helpers de cookie --------
    const getClienteCookie = (): any | null => {
        try {
            const raw = Cookies.get("cliente");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const getUserIdFromCookie = (): string => {
        const parsed = getClienteCookie();
        const id = (parsed?.id ?? parsed?.userId);
        return id ? String(id) : "";
    };

    // -------- Buscar usuário (HOOKS NO TOPO) --------
    const fetchUser = useCallback(async (signal?: AbortSignal) => {
        const userIdFromCookie = getUserIdFromCookie();
        if (!userIdFromCookie) return;

        try {
            const res = await fetch("/api/send-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reqMethod: "GET",
                    reqEndpoint: "/list-users",
                    reqHeaders: {
                        "X-Environment": "HOMOLOGACAO",
                        userIsActive: "1",
                        userIsDeleted: "0",
                        userId: userIdFromCookie,
                    },
                }),
                signal,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result?.message || "Erro ao buscar dados do usuário");

            setUser(result?.data?.result?.[0] ?? result);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("Erro ao requisitar dados do usuário para API externa:", err);
        }
    }, []);

    useEffect(() => {
        const ac = new AbortController();
        fetchUser(ac.signal);
        return () => ac.abort();
    }, [fetchUser]);

    // -------- Totais do carrinho --------
    const totals = useMemo(() => {
        const totalProducts = cart.reduce((sum: number, it: any) => {
            const q = Number.parseInt(String(it.quantity || 0), 10) || 0;
            const price = Number(it.price || 0);
            return sum + q * price;
        }, 0);
        return { totalProducts };
    }, [cart]);

    // -------- Payload puro (sem hooks) --------
    const buildOrderPayload = () => {
        const userIdFromCookie = getUserIdFromCookie();
        const clienteCookie = getClienteCookie();

        // helpers
        const cleanStr = (v: unknown) => (typeof v === "string" ? v.trim() : v);
        const nonEmpty = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";
        const pick = (...vals: any[]) => {
            for (const v of vals) {
                const c = cleanStr(v);
                if (nonEmpty(c)) return String(c);
            }
            return "";
        };
        const digits = (s: string) => s.replace(/\D+/g, "");
        const upper = (s: string) => s.toUpperCase();

        // prefer list-users primary entries
        const uPhone = (user?.phones && user.phones[0]) || user?.phone;
        const uAddr = (user?.addresses && user.addresses[0]) || user?.address;

        const areaCodeRaw = pick(
            uPhone?.areaCode,
            user?.phone?.areaCode,
            clienteCookie?.areaCode,
            clienteCookie?.ddd,
            clienteCookie?.phone?.areaCode,
            clienteCookie?.phones?.[0]?.areaCode,
        );
        const areaCode = digits(areaCodeRaw);

        const phoneRaw = pick(
            uPhone?.number,
            user?.phone?.number,
            clienteCookie?.telefone,
            clienteCookie?.phone,
            clienteCookie?.phone?.number,
            clienteCookie?.phones?.[0]?.number,
        );
        const phone = digits(phoneRaw);

        const addrIbge = pick(
            uAddr?.ibge,
            user?.address?.ibge,
            clienteCookie?.addressIbge,
            clienteCookie?.address?.ibge,
            clienteCookie?.addresses?.[0]?.ibge,
        );

        const addrZip = digits(pick(
            uAddr?.zipcode,
            user?.address?.zipcode,
            clienteCookie?.zipCodeBilling,
            clienteCookie?.addressZip,
            clienteCookie?.cep,
            clienteCookie?.address?.zipcode,
            clienteCookie?.addresses?.[0]?.zipcode,
        ));

        const addrStreet = pick(
            uAddr?.street,
            user?.address?.street,
            clienteCookie?.addressStreet,
            clienteCookie?.street,
            clienteCookie?.logradouro,
            clienteCookie?.address?.street,
            clienteCookie?.addresses?.[0]?.street,
        );

        const addrNumber = pick(
            uAddr?.number,
            user?.address?.number,
            clienteCookie?.addressNumber,
            clienteCookie?.number,
            clienteCookie?.numero,
            clienteCookie?.address?.number,
            clienteCookie?.addresses?.[0]?.number,
        );

        const addrComplement = pick(
            uAddr?.complement,
            user?.address?.complement,
            clienteCookie?.addressComplement,
            clienteCookie?.complement,
            clienteCookie?.complemento,
            clienteCookie?.address?.complement,
            clienteCookie?.addresses?.[0]?.complement,
        );

        const addrNeighborhood = pick(
            uAddr?.neighborhood,
            user?.address?.neighborhood,
            clienteCookie?.addressNeighborhood,
            clienteCookie?.neighborhood,
            clienteCookie?.bairro,
            clienteCookie?.address?.neighborhood,
            clienteCookie?.addresses?.[0]?.neighborhood,
        );

        const addrCity = pick(
            uAddr?.city,
            user?.address?.city,
            clienteCookie?.addressCity,
            clienteCookie?.city,
            clienteCookie?.municipio,
            clienteCookie?.address?.city,
            clienteCookie?.addresses?.[0]?.city,
        );

        const addrState = upper(pick(
            uAddr?.stateCode,
            user?.address?.stateCode,
            clienteCookie?.uf,
            clienteCookie?.addressState,
            clienteCookie?.stateCode,
            clienteCookie?.address?.stateCode,
            clienteCookie?.addresses?.[0]?.stateCode,
        ));

        const frete = Number(Cookies.get("valorFrete") || clienteCookie?.valorFrete || 0) || 0;

        const payload = {
            storeId: "32",
            userId: userIdFromCookie,
            entityType: user?.entityType || "PF",
            legalName: user?.legalName || user?.fullName || "",
            cpfCnpf: user?.cpf || user?.cnpj || "",
            ie: user?.ie || "",
            email: user?.email || "",
            areaCode,
            phone,

            entityTypeBilling: user?.entityType || clienteCookie?.entityTypeBilling || "PF",
            legalNameBilling: user?.legalName || user?.fullName || "",
            contactNameBilling: user?.legalName || user?.fullName || "",
            cpfCnpfBilling: (user?.cpf || user?.cnpj || "") || clienteCookie?.cpfCnpfBilling || "",
            ieBilling: (user?.ie || "") || clienteCookie?.ieBilling || "",
            emailBilling: (user?.email || "") || clienteCookie?.emailBilling || "",
            areaCodeBilling: areaCode || clienteCookie?.areaCodeBilling || "",
            phoneBilling: phone || clienteCookie?.phoneBilling || "",
            addressIbgeCodeBilling: addrIbge || clienteCookie?.addressIbgeCodeBilling || "",
            zipCodeBilling: addrZip || clienteCookie?.zipCodeBilling || "",
            streetNameBilling: addrStreet || clienteCookie?.streetNameBilling || "",
            streetNumberBilling: addrNumber || clienteCookie?.streetNumberBilling || "",
            addressLine2Billing: addrComplement || clienteCookie?.addressLine2Billing || "",
            addressNeighborhoodBilling: addrNeighborhood || clienteCookie?.addressNeighborhoodBilling || "",
            addressCityBilling: addrCity || clienteCookie?.addressCityBilling || "",
            addressStateCodeBilling: addrState || clienteCookie?.addressStateCodeBilling || "",

            entityTypeShipping: user?.entityType || "PF",
            legalNameShipping: user?.legalName || user?.fullName || "",
            contactNameShipping: user?.legalName || user?.fullName || "",
            cpfCnpfShipping: user?.cpf || user?.cnpj || "",
            ieShipping: user?.ie || "",
            emailShipping: user?.email || "",
            areaCodeShipping: areaCode,
            phoneShipping: phone,
            addressIbgeCodeShipping: addrIbge || clienteCookie?.addressIbgeCodeBilling || "",
            zipCodeShipping: addrZip || clienteCookie?.zipCodeBilling || "",
            streetNameShipping: addrStreet || clienteCookie?.streetNameBilling || "",
            streetNumberShipping: addrNumber || clienteCookie?.streetNumberBilling || "",
            addressLine2Shipping: addrComplement || clienteCookie?.addressLine2Billing || "",
            addressNeighborhoodShipping: addrNeighborhood || clienteCookie?.addressNeighborhoodBilling || "",
            addressCityShipping: addrCity || clienteCookie?.addressCityBilling || "",
            addressStateCodeShipping: addrState || clienteCookie?.addressStateCodeBilling || "",

            paymentMethod: "Boleto",
            numberOfInstallments: "1",
            totalProductsAmount: totals.totalProducts.toFixed(2),
            totalDiscountAmount: "0.00",
            totalShippingAmount: frete.toFixed(2),
            totalInterestAmount: "0.00",
            orderTotalAmount: (totals.totalProducts + frete).toFixed(2),
            totalTaxAmount: "0",
            paymentStatus: "PENDENTE",
            orderStatus: isAdmin ? "Aprovado" : "Aguardando aprovação",
            expectedDeliveryDate: "",
            deliveryDate: "",
            paymentDate: "",
        } as const;

        return payload;
    };

    // -------- Ações --------
    const handleAproved = async () => {
        setStatus("approved");
        try {
            const payload = buildOrderPayload();
            // Persistir o payload para sobreviver a reload/navegação
            Cookies.set("pedidoPayload", JSON.stringify(payload), {
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                // expira em 1 dia (ajuste conforme necessidade)
                expires: 1,
            });
            await fetchOrderNumber();
        } finally {
            router.push("/pedido");
        }
    };
    const handleRequested = async () => {
        setStatus("requested");
        try {
            const payload = buildOrderPayload();
            Cookies.set("pedidoPayload", JSON.stringify(payload), {
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                expires: 1,
            });
            await fetchOrderNumber();
        } finally {
            router.push("/pedido");
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex md:flex-row flex-col gap-4 flex-1 h-full p-4 space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 flex flex-col justify-center items-center gap-3 w-full h-fit md:w-1/2 shadow-lg ">
                    {isAdmin ? (
                        <>
                            <div className="w-full h-full flex justify-center items-center flex-col flex-wrap gap-8">
                                <div className="w-full h-full flex justify-center items-center flex-col flex-wrap gap-6">
                                    <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 border border-green-200">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600">
                                            <Check size={14} className="text-white" />
                                        </span>
                                        <span className="text-xs text-green-700 font-medium">Pronto para finalizar</span>
                                    </div>

                                    <h1 className="text-gray-800 text-center text-base md:text-lg max-w-[460px] px-6 leading-relaxed">
                                        Seu pedido está quase concluído. Revise os detalhes abaixo e, se estiver tudo certo, finalize a compra.
                                    </h1>
                                </div>

                                <div className="flex flex-col justify-center gap-4 max-w-[300px] w-full">
                                    <button
                                        onClick={handleAproved}
                                        disabled={!freteValido}
                                        className={`w-full px-4 py-2 rounded-md text-white text-sm ${!freteValido ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-500 cursor-pointer"}`}
                                    >
                                        {freteValido ? "Finalizar Compra" : "Aguardando cálculo do frete..."}
                                    </button>

                                    <button
                                        onClick={() => setStatus("rejected")}
                                        className="w-full px-4 py-2 rounded-md bg-gray-400 text-white hover:bg-orange-500 text-sm cursor-pointer"
                                    >
                                        Cancelar Compra
                                    </button>

                                    {status === "rejected" && (
                                        <div className="w-full mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                            <h3 className="font-medium text-red-800 mb-2">Confirmar cancelamento do pedido</h3>
                                            <p className="text-sm text-red-700 mb-3">Tem certeza que deseja cancelar este pedido?</p>
                                            <label className="text-sm text-red-900 mb-1 block">Motivo (opcional)</label>
                                            <textarea
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                rows={4}
                                                className="w-full rounded-md border border-red-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                                placeholder="Descreva o motivo do cancelamento (opcional)"
                                            />
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={() => setStatus("cancelled")}
                                                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 text-sm"
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => setStatus("idle")}
                                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                                                >
                                                    Voltar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-200 mb-2">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                                    <Check size={14} className="text-white" />
                                </span>
                                <span className="text-xs text-blue-700 font-medium">Aprovação necessária</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleRequested}
                                    className="px-4 py-2 rounded-md text-white text-sm bg-blue-600 hover:bg-blue-500 cursor-pointer"
                                >
                                    Solicitar Aprovação
                                </button>
                            </div>

                            {status === "requested" && (
                                <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-800 text-sm">
                                    Obrigado por sua compra!
                                    Seu pedido está em processo de aprovação.
                                    Assim que tudo estiver pronto, você receberá uma mensagem com o status do seu pedido.
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex flex-col flex-1 w-full lg:w-1/2">
                    <div className="rounded-lg border border-gray-200 shadow-lg p-4">
                        <Resumo delivery={delivery} />
                    </div>
                </div>
            </div>
        </div>
    );
}
