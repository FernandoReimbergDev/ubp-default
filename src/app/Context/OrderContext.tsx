"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { OrderDetails } from "@/app/types/order";
import { apiGet } from "@/app/services/api";

type ExternalOrder = {
  orderId: string;
  storeId: string;
  userId?: string;
  entityType: string;
  legalName: string;
  cpfCnpj: string;
  ie?: string;
  email: string;
  areaCode: string;
  phone: string;
  entityTypeBilling: string;
  legalNameBilling: string;
  cpfCnpjBilling: string;
  ieBilling?: string;
  contactNameBilling: string;
  emailBilling: string;
  areaCodeBilling: string;
  phoneBilling: string;
  addressIbgeCodeBilling?: string;
  zipCodeBilling: string;
  streetNameBilling: string;
  streetNumberBilling: string;
  addressLine2Billing?: string;
  addressNeighborhoodBilling: string;
  addressCityBilling: string;
  addressStateCodeBilling: string;
  entityTypeShipping: string;
  legalNameShipping: string;
  cpfCnpjShipping: string;
  ieShipping?: string;
  contactNameShipping: string;
  emailShipping?: string;
  areaCodeShipping: string;
  phoneShipping: string;
  addressIbgeCodeShipping?: string;
  zipCodeShipping: string;
  streetNameShipping: string;
  streetNumberShipping: string;
  addressLine2Shipping?: string;
  addressNeighborhoodShipping: string;
  addressCityShipping: string;
  addressStateCodeShipping: string;
  paymentMethod: string;
  numberOfInstallments?: string;
  totalProductsAmount: string;
  totalDiscountAmount: string;
  totalShippingAmount: string;
  totalInterestAmount: string;
  orderTotalAmount: string;
  totalTaxAmount?: string;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  paymentDate?: string;
};

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function mapExternalOrderToOrderDetails(src: ExternalOrder): OrderDetails {
  return {
    orderId: src.orderId,
    storeId: src.storeId,
    sellerId: src.userId || "",
    sellerName: "",
    orderStatus: src.orderStatus || "",
    buyer: {
      entityType: src.entityType,
      legalName: src.legalName,
      email: src.email,
      areaCode: src.areaCode,
      phone: src.phone,
      key: src.userId || "",
      cpfCnpj: src.cpfCnpj ,
      ie: src.ie,
    },
    billing: {
      legalName: src.legalNameBilling,
      cpfCnpj: src.cpfCnpjBilling,
      ie: src.ieBilling,
      entityType: src.entityTypeBilling,
      contactName: src.contactNameBilling,
      contactEmail: src.emailBilling,
      contactPhoneAreaCode: src.areaCodeBilling,
      contactPhone: src.phoneBilling,
      address: {
        name: src.streetNameBilling,
        number: src.streetNumberBilling,
        line2: src.addressLine2Billing,
        neighborhood: src.addressNeighborhoodBilling,
        city: src.addressCityBilling,
        stateCode: src.addressStateCodeBilling,
        zipCode: src.zipCodeBilling,
        ibgeCode: src.addressIbgeCodeBilling,
      },
      status: src.paymentStatus,
    },
    delivery: {
      legalName: src.legalNameShipping,
      cpfCnpf: src.cpfCnpjShipping,
      ie: src.ieShipping,
      entityType: src.entityTypeShipping,
      contactName: src.contactNameShipping,
      contactEmail: src.emailShipping,
      contactPhoneAreaCode: src.areaCodeShipping,
      contactPhone: src.phoneShipping,
      address: {
        name: src.streetNameShipping,
        number: src.streetNumberShipping,
        line2: src.addressLine2Shipping,
        neighborhood: src.addressNeighborhoodShipping,
        city: src.addressCityShipping,
        stateCode: src.addressStateCodeShipping,
        zipCode: src.zipCodeShipping,
        ibgeCode: src.addressIbgeCodeShipping,
      },
      status: undefined,
      method: undefined,
      trackingCode: undefined,
    },
    payment: {
      method: src.paymentMethod,
      totalAmount: toNumber(src.orderTotalAmount),
      installments: src.numberOfInstallments ? Number(src.numberOfInstallments) : undefined,
      interestRate: undefined,
      interestAmount: toNumber(src.totalInterestAmount, 0),
      status: src.paymentStatus,
      paymentDate: src.paymentDate,
      expirationDate: undefined,
    },
    products: [],
    totalProductsAmount: toNumber(src.totalProductsAmount, 0),
    totalDiscountAmount: toNumber(src.totalDiscountAmount, 0),
    totalShippingAmount: toNumber(src.totalShippingAmount, 0),
    totalInterestAmount: toNumber(src.totalInterestAmount, 0),
    orderTotalAmount: toNumber(src.orderTotalAmount, 0),
    createdAt: src.createdAt || "",
    updatedAt: src.updatedAt || "",
    expectedDeliveryDate: src.expectedDeliveryDate || "",
    deliveredDate: src.deliveryDate || "",
    paymentDate: src.paymentDate || "",
  };
}

type OrdersState = {
  orders: OrderDetails[];
  loading: boolean;
  error?: string;
  refresh: (params?: Record<string, any>) => Promise<void>;
  getById: (id: string) => Promise<OrderDetails | null>;
};

const OrdersContext = createContext<OrdersState | null>(null);

type Props = {
  children: React.ReactNode;
  autoFetch?: boolean;
  initialParams?: Record<string, any>;
};

export function OrdersProvider({ children, autoFetch = true, initialParams }: Props) {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async (params?: Record<string, any>) => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await apiGet<any>("/api/order", { params });
      const payload = (data && (data as any).data) ? (data as any).data : data;
      const list: ExternalOrder[] = Array.isArray(payload)
        ? payload as any
        : Array.isArray((payload as any)?.result)
        ? (payload as any).result
        : [];
      setOrders(list.map(mapExternalOrderToOrderDetails));
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: string) => {
    try {
      const data = await apiGet<any>(`/api/order/${id}`);
      const payload = (data && (data as any).data) ? (data as any).data : data;
      const item: ExternalOrder | undefined = Array.isArray((payload as any)?.result)
        ? (payload as any).result[0]
        : (payload as any);
      return item ? mapExternalOrderToOrderDetails(item) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) refresh(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  const value = useMemo<OrdersState>(() => ({ orders, loading, error, refresh, getById }), [orders, loading, error, refresh, getById]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders deve ser usado dentro de OrdersProvider");
  return ctx;
}