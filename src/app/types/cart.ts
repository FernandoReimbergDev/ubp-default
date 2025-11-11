// Tipos do carrinho (entrada do modal e persistência)

// In CartContext.tsx
export interface AddressData {
    id: number;
    userId: number;
    entityType: string;
    contactName: string;
    legalName: string;
    cpfCnpj: string;
    ie: string;
    email: string;
    areaCode: string;
    phone: string;
    addressIbgeCode: string;
    zipCode: string;
    streetName: string;
    streetNumber: string;
    addressLine2: string;
    addressNeighborhood: string;
    addressCity: string;
    addressStateCode: string;
    createdAt: string;
    updatedAt: string;
}

// Update the CartContextType to use the new interface
export type fetchGetAddress = (userId: number) => Promise<AddressData | undefined>;

export type PersonalizationLite = {
    chavePersonal?: string;
    descricao?: string;
    precoUnitario: number;
    precoTotal: number;
};

export type CartItemInput = {
    id: string;
    codPro: string;
    chavePro?: string;

    productName: string;
    alt?: string;

    color: string;
    size?: string;

    unitPriceBase: number;
    unitPricePersonalization: number;
    unitPriceEffective: number;

    quantity: number;   // número (não string)
    subtotal: number;

    hasPersonalization?: boolean;
    personalization?: PersonalizationLite;

    // opcionais leves
    peso?: number | string;
    altura?: number | string;
    largura?: number | string;
    comprimento?: number | string;

    thumb?: string; // opcional para exibir no minicart
};

export type CartItemPersist = CartItemInput; // mesmo shape

export type CartContextType = {
    cart: CartItemPersist[];
    cartReady: boolean;
    openCart: boolean;
    setOpenCart: (v: boolean) => void;
    fetchProductFrete: (purchaseAmount: string, uf: string, city: string, zip: string, weightKg: string, altura: string, largura: string, comprimento: string) => Promise<number | undefined>;
    fetchSendAddress: (userId: number,
        entityTypeShipping: string,
        contactNameShipping: string,
        legalNameShipping: string,
        cpfCnpfShipping: string,
        ieShipping: string,
        emailShipping: string,
        areaCodeShipping: string,
        phoneShipping: string,
        addressIbgeCodeShipping: string,
        zipCodeShipping: string,
        streetNameShipping: string,
        streetNumberShipping: string,
        addressLine2Shipping: string,
        addressNeighborhoodShipping: string,
        addressCityShipping: string,
        addressStateCodeShipping: string) => Promise<number | undefined>;
    fetchGetAddress: (userId: number) => Promise<{
        id: number;
        userId: number;
        entityType: string;
        contactName: string;
        legalName: string;
        cpfCnpj: string;
        ie: string;
        email: string;
        areaCode: string;
        phone: string;
        addressIbgeCode: string;
        zipCode: string;
        streetName: string;
        streetNumber: string;
        addressLine2: string;
        addressNeighborhood: string;
        addressCity: string;
        addressStateCode: string;
        createdAt: string;
        updatedAt: string;
    } | undefined>;
    initializeCart: () => void;
    addProduct: (product: CartItemInput) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateColorOrSize: (id: string, newColor?: string, newSize?: string) => void;
    removeProduct: (id: string) => void;
    clearCart: () => void;
};
