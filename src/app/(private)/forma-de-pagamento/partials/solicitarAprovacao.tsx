/* eslint-disable @typescript-eslint/no-explicit-any */
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
    entityTypeShipping: string;
    legalNameShipping: string;
    contactNameShipping: string;
    cpfCnpfShipping: string;
    ieShipping: string;
    emailShipping: string;
    areaCodeShipping: string;
    phoneShipping: string;
    addressIbgeCodeShipping: string;
    zipCodeShipping: string;
    streetNameShipping: string;
    streetNumberShipping: string;
    addressLine2Shipping: string;
    addressNeighborhoodShipping: string;
    addressCityShipping: string;
    addressStateCodeShipping: string;
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
    address?: OrderPayload;
    addresses?: Address[];
};

interface OrderPayload {
    // Basic info
    storeId: string;
    userId: number;

    // User info
    entityType: string;
    legalName: string;
    fullName: string;
    cpfCnpf: string;
    ie: string;
    email: string;
    areaCode: string;
    phone: string;

    // Billing info
    entityTypeBilling: string;
    legalNameBilling: string;
    contactNameBilling: string;
    cpfCnpfBilling: string;
    ieBilling: string;
    emailBilling: string;
    areaCodeBilling: string;
    phoneBilling: string;
    addressIbgeCodeBilling: string;
    zipCodeBilling: string;
    streetNameBilling: string;
    streetNumberBilling: string;
    addressLine2Billing: string;
    addressNeighborhoodBilling: string;
    addressCityBilling: string;
    addressStateCodeBilling: string;

    // Shipping info
    entityTypeShipping: string;
    legalNameShipping: string;
    contactNameShipping: string;
    cpfCnpfShipping: string;
    ieShipping: string;
    emailShipping: string;
    areaCodeShipping: string;
    phoneShipping: string;
    addressIbgeCodeShipping: string;
    zipCodeShipping: string;
    streetNameShipping: string;
    streetNumberShipping: string;
    addressLine2Shipping: string;
    addressNeighborhoodShipping: string;
    addressCityShipping: string;
    addressStateCodeShipping: string;

    // Order info
    paymentMethod: string;
    numberOfInstallments: string;
    totalProductsAmount: string;
    totalDiscountAmount: string;
    totalShippingAmount: string;
    totalInterestAmount: string;
    orderTotalAmount: string;
    totalTaxAmount: string;
    paymentStatus: string;
    orderStatus: string;
    expectedDeliveryDate: string;
    deliveryDate: string;
    paymentDate: string;
}

export function SolicitarAprovacao() {
    const { hasAnyRole, fetchOrderNumber } = useAuth();
    const { cart, clearCart } = useCart();
    const isAdmin = hasAnyRole(["Administrador"]);
    const router = useRouter();
    const { fetchGetAddress } = useCart();
    const [status, setStatus] = useState<"idle" | "confirm" | "approved" | "rejected" | "requested" | "cancelled">("idle");
    const [cancelReason, setCancelReason] = useState("");
    const [user, setUser] = useState<UserShape | null>(null);
    const [freteValido, setFreteValido] = useState(false);
    const [addressShipping, setAddressShipping] = useState<Address | null>(null);

    useEffect(() => {
        const id = setInterval(() => {
            try {
                setFreteValido(true);
            } catch {
                setFreteValido(false);
            }
        }, 500);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        fetchGetAddress(2);
    }, [fetchGetAddress]);

    // -------- Helpers de cookie --------
    const getClienteCookie = useCallback((): any | null => {
        try {
            const raw = Cookies.get("cliente");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, []);

    const getUserIdFromCookie = useCallback((): string => {
        const parsed = getClienteCookie();
        const id = (parsed?.id ?? parsed?.userId);
        return id ? String(id) : "";
    }, [getClienteCookie]);

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
            // console.log(result)
            setUser(result?.data?.result?.[0]);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("Erro ao requisitar dados do usuário para API externa:", err);
        }
    }, [getUserIdFromCookie]);

    const fetchShippingTemp = useCallback(async (signal?: AbortSignal) => {
        const userIdFromCookie = getUserIdFromCookie();
        if (!userIdFromCookie) return;
        try {
            const res = await fetch("/api/send-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reqMethod: "GET",
                    reqEndpoint: "/temp-address-shipping",
                    reqHeaders: {
                        "X-Environment": "HOMOLOGACAO",
                        userId: userIdFromCookie,
                    },
                }),
                signal,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result?.message || "Erro ao buscar dados de entrega temp");
            // console.log(result.data.result)
            setAddressShipping(result?.data?.result);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            console.error("Erro ao requisitar dados de entrega temp para API externa:", err);
        }
    }, [getUserIdFromCookie]);

    useEffect(() => {
        const ac = new AbortController();
        fetchUser(ac.signal);
        fetchShippingTemp(ac.signal);
        return () => ac.abort();
    }, [fetchUser, fetchShippingTemp]);

    const quantities = useMemo(() => {
        return cart.reduce((acc, item) => {
            acc[item.id] = String(item.quantity);
            return acc;
        }, {} as Record<string, string>);
    }, [cart]);

    // -------- Totais do carrinho --------
    const totalValue = useMemo(() => {
        return cart.reduce((total, product) => {
            const q = parseInt(quantities[product.id] || "0", 10);
            return total + (isNaN(q) ? 0 : q * product.unitPriceEffective);
        }, 0);
    }, [cart, quantities]);

    const delivery = useMemo(() => {
        const zipDigits = (addressShipping?.zipCodeShipping || "").replace(/\D/g, "");
        return {
            stateCode: (addressShipping?.addressStateCodeShipping || "").toUpperCase(),
            city: addressShipping?.addressCityShipping || "",
            zipCode: zipDigits,
        };
    }, [addressShipping]);

    const frete = Number(Cookies.get("valorFrete") || "0") || 0;
    const payload: any = {
        storeId: "32",
        userId: 2,
        entityType: user?.entityType || "PF",
        legalName: user?.legalName || user?.fullName || "",
        cpfCnpf: user?.cpf || user?.cnpj || "",
        ie: user?.ie || "",
        email: user?.email || "",
        areaCode: user?.phones?.[0].areaCode || "11",
        phone: user?.phones?.[0].number || "",

        entityTypeBilling: "PJ",
        legalNameBilling: "Caixa Vida e Previdencia S/A",
        contactNameBilling: user?.fullName || "",
        cpfCnpfBilling: "03730204000176",
        ieBilling: user?.ie || "",
        emailBilling: user?.email || "",
        areaCodeBilling: user?.phones?.[0].areaCode || "11",
        phoneBilling: user?.phones?.[0].number || "",
        addressIbgeCodeBilling: "",
        zipCodeBilling: "04583110",
        streetNameBilling: "Av. Doutor Chucri Zaidan",
        streetNumberBilling: "246",
        addressLine2Billing: "12º andar",
        addressNeighborhoodBilling: "Vila Cordeiro",
        addressCityBilling: "São Paulo",
        addressStateCodeBilling: "SP",

        entityTypeShipping: addressShipping?.entityTypeShipping || "PJ",
        legalNameShipping: addressShipping?.legalNameShipping || "",
        contactNameShipping: addressShipping?.contactNameShipping || user?.fullName || "",
        cpfCnpfShipping: addressShipping?.cpfCnpfShipping || user?.cpf || user?.cnpj || "",
        ieShipping: addressShipping?.ieShipping || user?.ie || "",
        emailShipping: addressShipping?.emailShipping || user?.email || "",
        areaCodeShipping: addressShipping?.areaCodeShipping || user?.phone?.areaCode || "",
        phoneShipping: addressShipping?.phoneShipping || user?.phone?.number || "",
        addressIbgeCodeShipping: addressShipping?.addressIbgeCodeShipping || "",
        zipCodeShipping: addressShipping?.zipCodeShipping || "",
        streetNameShipping: addressShipping?.streetNameShipping || "",
        streetNumberShipping: addressShipping?.streetNumberShipping || "",
        addressLine2Shipping: addressShipping?.addressLine2Shipping || "",
        addressNeighborhoodShipping: addressShipping?.addressNeighborhoodShipping || "",
        addressCityShipping: addressShipping?.addressCityShipping || "",
        addressStateCodeShipping: addressShipping?.addressStateCodeShipping || "",

        paymentMethod: "Boleto",
        numberOfInstallments: "1",
        totalProductsAmount: totalValue.toFixed(2),
        totalDiscountAmount: "0.00",
        totalShippingAmount: frete.toFixed(2),
        totalInterestAmount: "0.00",
        orderTotalAmount: (totalValue + frete).toFixed(2),
        totalTaxAmount: "0",
        paymentStatus: "PENDENTE",
        orderStatus: isAdmin ? "Aprovado" : "Aguardando aprovação",
        expectedDeliveryDate: "",
        deliveryDate: "",
        paymentDate: "",
    }

    // -------- Ações --------
    const handleAproved = async () => {
        setStatus("approved");
        try {
            try { localStorage.setItem("pedidoPayload", JSON.stringify(payload)); } catch { }
            try { Cookies.remove("pedidoPayload", { path: "/" }); } catch { }
            await fetchOrderNumber();
        } finally {
            router.push("/pedido");
        }
    };
    const handleRequested = async () => {
        setStatus("requested");
        try {
            try { localStorage.setItem("pedidoPayload", JSON.stringify(payload)); } catch { }
            try { Cookies.remove("pedidoPayload", { path: "/" }); } catch { }
            await fetchOrderNumber();
        } finally {
            router.push("/pedido");
        }
    };
    const handleCancelConfirm = () => {
        clearCart();
        router.push("/");
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
                                        Obrigado por sua compra!
                                        Revise os detalhes do seu pedido e clique para finalizar sua solicitação.
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
                                                    onClick={handleCancelConfirm}
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
