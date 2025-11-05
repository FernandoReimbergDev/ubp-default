// utils/saveDeliveryCookie.ts
import Cookies from "js-cookie";

type BillingFields = {
    entityTypeBilling: string;
    legalNameBilling: string;
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
};

export function saveDeliveryCookie(fields: BillingFields & { id?: string }) {
    let current: any = {};
    try {
        current = JSON.parse(Cookies.get("cliente") || "{}");
    } catch { }

    const nextValue = {
        ...current,
        ...(fields.id ? { id: String(fields.id) } : {}),
        entityTypeBilling: fields.entityTypeBilling || "",
        legalNameBilling: fields.legalNameBilling || "",
        cpfCnpfBilling: fields.cpfCnpfBilling || "",
        ieBilling: fields.ieBilling || "",
        emailBilling: fields.emailBilling || "",
        areaCodeBilling: fields.areaCodeBilling || "",
        phoneBilling: fields.phoneBilling || "",
        addressIbgeCodeBilling: fields.addressIbgeCodeBilling || "",
        zipCodeBilling: fields.zipCodeBilling || "",
        streetNameBilling: fields.streetNameBilling || "",
        streetNumberBilling: fields.streetNumberBilling || "",
        addressLine2Billing: fields.addressLine2Billing || "",
        addressNeighborhoodBilling: fields.addressNeighborhoodBilling || "",
        addressCityBilling: fields.addressCityBilling || "",
        addressStateCodeBilling: fields.addressStateCodeBilling || "",
        ddd: fields.areaCodeBilling || current.ddd || "",
        telefone: fields.phoneBilling || current.telefone || "",
        cep: fields.zipCodeBilling || current.cep || "",
        logradouro: fields.streetNameBilling || current.logradouro || "",
        numero: fields.streetNumberBilling || current.numero || "",
        bairro: fields.addressNeighborhoodBilling || current.bairro || "",
        municipio: fields.addressCityBilling || current.municipio || "",
        uf: fields.addressStateCodeBilling || current.uf || "",
        areaCode: fields.areaCodeBilling || current.areaCode || "",
        phone: fields.phoneBilling || current.phone || "",
        addressZip: fields.zipCodeBilling || current.addressZip || "",
        addressStreet: fields.streetNameBilling || current.addressStreet || "",
        addressNumber: fields.streetNumberBilling || current.addressNumber || "",
        addressNeighborhood: fields.addressNeighborhoodBilling || current.addressNeighborhood || "",
        addressCity: fields.addressCityBilling || current.addressCity || "",
        addressState: fields.addressStateCodeBilling || current.addressState || "",
        phoneObj: undefined,
        addressObj: undefined,
    } as any;

    if (!nextValue.phone || typeof nextValue.phone === "object") {
        nextValue.phone = nextValue.telefone || "";
    }

    const normalizedPhone = {
        areaCode: nextValue.ddd || nextValue.areaCode || "",
        number: (typeof nextValue.phone === "string" ? nextValue.phone : "") || nextValue.telefone || "",
    };

    const normalizedAddress = {
        zipcode: nextValue.cep || nextValue.addressZip || "",
        street: nextValue.logradouro || nextValue.addressStreet || "",
        number: nextValue.numero || nextValue.addressNumber || "",
        complement: nextValue.addressLine2Billing || current.complement || "",
        neighborhood: nextValue.bairro || nextValue.addressNeighborhood || "",
        city: nextValue.municipio || nextValue.addressCity || "",
        stateCode: nextValue.uf || nextValue.addressState || "",
        ibge: nextValue.addressIbgeCodeBilling || current.addressIbgeCodeBilling || "",
    };

    nextValue.phone = normalizedPhone.number;
    nextValue.phones = [{ ...normalizedPhone }];

    nextValue.address = { ...normalizedAddress };
    nextValue.addresses = [{ ...normalizedAddress }];

    Cookies.set("cliente", JSON.stringify(nextValue), {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: 30 // dias
    });
}