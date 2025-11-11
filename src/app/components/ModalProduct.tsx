/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, ShoppingCart, Tag, X } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../Context/CartContext";
import { useToast } from "../Context/ToastProvider";
import { ModalProps, stock } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import { Button } from "./Button";
import { ZoomProduct } from "./ZoomProduct";
import type { CartItemInput } from "../types/cart";


// ===== Tipos utilitários (ajuste os imports conforme seu projeto) =====
export type PersonalizacaoPreco = {
  chavePersonalPrc: string;
  qtdiPersonalPrc: string; // números como string
  qtdfPersonalPrc: string;
  vluPersonalPrc: string; // preço unitário por peça na faixa
};

export type Personalizacao = {
  codPersonal: any;
  chavePersonal: string;
  descrWebPersonal: string;
  descrPersonal?: string;
  precos?: PersonalizacaoPreco[];
};


// ===== Helpers puros =====
function toInt(val: string | number | undefined | null): number | undefined {
  if (val === undefined || val === null) return undefined;
  const n = parseInt(String(val).trim(), 10);
  return Number.isFinite(n) ? n : undefined;
}


function toFloat(val: string | number | undefined | null): number | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  // Permite formatos "1.234,56" ou "1234.56"
  const normalized = s.includes(',') && s.includes('.')
    ? s.replace(/\./g, '').replace(',', '.')
    : s.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}


/** Retorna o preço unitário da personalização, baseado na faixa de quantidade. */
export function getPersonalizationUnitPrice(
  personalization: Personalizacao,
  quantity: number
): number {
  if (!personalization?.precos?.length || quantity <= 0) return 0;


  const faixa = personalization.precos.find((p) => {
    const min = toInt(p.qtdiPersonalPrc) ?? 0;
    const max = toInt(p.qtdfPersonalPrc) ?? Number.MAX_SAFE_INTEGER;
    return quantity >= min && quantity <= max;
  });


  return faixa ? (toFloat(faixa.vluPersonalPrc) ?? 0) : 0;
}


/** Soma o preço unitário de todas as personalizações selecionadas (1 por grupo). */
export function sumSelectedPersonalizationsUnitPrice(
  selected: Record<string, Personalizacao | null>,
  quantity: number
): number {
  if (!selected || quantity <= 0) return 0;
  return Object.values(selected).reduce((acc, p) => {
    if (!p) return acc;
    return acc + getPersonalizationUnitPrice(p, quantity);
  }, 0);
}


/** Indica se há ao menos UMA personalização selecionada. */
export function hasAnyPersonalization(selected: Record<string, Personalizacao | null>): boolean {
  return Object.values(selected).some((p) => !!p);
}

export function ModalProduto({ ProductData, onClose }: ModalProps) {
  const toast = useToast();
  const { addProduct } = useCart();

  // ======= Estados essenciais =======
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedPersonalizations, setSelectedPersonalizations] = useState<Record<string, Personalizacao | null>>({});
  const [zoomModal, setZoomModal] = useState(false);
  const [quantity, setQuantity] = useState<string>(""); // manter string p/ input controlado
  const [QtdMsg, setQtdMsg] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>(ProductData.srcFrontImage);
  const [descriFull, setDescriFull] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [product, setProduct] = useState<stock | undefined>(undefined);
  // Personalização
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  // ======= Infra por requisição (debounce/abort/timeout) =======
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ======= Utils =======
  const toNumberBR = useCallback((val: string | number | undefined) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    if (s === "") return undefined;
    if (s.includes(".") && s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
    if (s.includes(",")) return Number(s.replace(",", "."));
    return Number(s);
  }, []);

  // estoque do card (cálculo derivado p/ validação)
  const availableInt = useMemo(() => {
    const available = toNumberBR(product?.quantidadeSaldo);
    return typeof available === "number" && isFinite(available) ? Math.trunc(available) : undefined;
  }, [product, toNumberBR]);

  const requestedQty = useMemo(() => parseInt(quantity || "0", 10), [quantity]);
  const qtyInvalid = useMemo(
    () => typeof availableInt === "number" && requestedQty > availableInt,
    [availableInt, requestedQty]
  );

  const hasQty = requestedQty > 0;
  const hasGravacao = hasAnyPersonalization(selectedPersonalizations);


  // Preço unitário SOMENTE com gravação + quantidade válidas
  const personalizationUnit = React.useMemo(() => {
    if (!hasQty || !hasGravacao) return 0;
    return sumSelectedPersonalizationsUnitPrice(selectedPersonalizations, requestedQty);
  }, [hasQty, hasGravacao, selectedPersonalizations, requestedQty]);


  const effectiveUnitPrice = React.useMemo(() => {
    // Base do produto SEMPRE visível
    // Personalização só soma quando há qty e gravação
    return ProductData.price + personalizationUnit;
  }, [ProductData.price, personalizationUnit]);


  const total = React.useMemo(() => {
    if (!hasQty) return 0;
    return effectiveUnitPrice * requestedQty;
  }, [effectiveUnitPrice, hasQty, requestedQty]);


  const isControlledStock = ProductData.estControl === "1";

  const hasKnownStock =
    isControlledStock &&
    typeof ProductData.quantidadeEstoquePro === "string" &&
    ProductData.quantidadeEstoquePro.trim() !== "";

  const parsedStock = hasKnownStock
    ? Math.trunc(Number(ProductData.quantidadeEstoquePro.replace(",", ".")))
    : undefined;

  const isOutOfStock = isControlledStock && hasKnownStock && (parsedStock ?? 0) <= 0;

  // ======= Efeito de inicialização/reset do produto =======
  useEffect(() => {
    // inicializa cor/tamanho com o primeiro disponível, se houver
    setSelectedColor(ProductData.colors?.[0] ?? "");
    setSelectedSize(ProductData.sizes?.[0] ?? "");
    setCurrentImage(ProductData.srcFrontImage);

    // cleanup robusto (snapshot das refs p/ evitar warning)
    const debounces = fetchDebounceRef.current;
    const abortCtrl = fetchAbortRef.current;
    const timeoutId = fetchTimeoutRef.current;
    const oldPreview = filePreviewUrl;

    return () => {
      if (debounces) clearTimeout(debounces);
      if (abortCtrl) abortCtrl.abort();
      if (timeoutId) clearTimeout(timeoutId);
      if (oldPreview) URL.revokeObjectURL(oldPreview);
    };
  }, [ProductData, filePreviewUrl]);

  // ======= Fetch estoque =======
  const fetchProductsStock = useCallback(
    async (color?: string, size?: string, signal?: AbortSignal, reqId?: number) => {
      try {
        const payload: Record<string, unknown> = {
          codPro: ProductData.codePro,
          chavePro: ProductData.chavePro,
        };
        const c = color ?? selectedColor;
        const s = size ?? selectedSize;
        if (c && c.trim() !== "") payload.descrProCor = c;
        if (s && s.trim() !== "") payload.descrProTamanho = s;

        const doRequest = async () =>
          fetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal,
          });

        let res = await doRequest();
        if (!res.ok && (res.status === 429 || res.status >= 500)) {
          res = await doRequest(); // retry simples
        }

        const result: {
          success: boolean;
          data?: { success: boolean; message: string; result: { produtos: stock[] } | stock[] };
          message?: string;
          details?: unknown;
        } = await res.json();

        if (!res.ok) {
          const detailsStr = typeof result.details === "string" ? result.details : undefined;
          if (detailsStr === "Estoque não encontrado com os parâmetro(s) fornecido(s).") {
            toast.alert("Ops... Produto esgotado!");
            return;
          }
          throw new Error(result.message || "Erro ao buscar produtos");
        }

        const raw = result.data?.result as unknown;
        const produtos: stock[] = Array.isArray(raw) ? (raw as stock[]) : ((raw as { produtos?: stock[] })?.produtos ?? []);
        const first = produtos?.[0];

        if (reqId === requestIdRef.current) {
          setProduct(first ?? undefined);
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (reqId === requestIdRef.current) setLoading(false);
          return;
        }
        console.error("erro ao requisitar estoque", error);
      } finally {
        if (reqId === requestIdRef.current) {
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
            fetchTimeoutRef.current = null;
          }
          setLoading(false);
        }
      }
    },
    [ProductData.chavePro, ProductData.codePro, selectedColor, selectedSize, toast]
  );

  // dispara consulta com debounce quando há quantidade válida
  const scheduleFetch = useCallback(
    (color?: string, size?: string, delayMs = 600) => {
      // ❌ não consulta nada quando NÃO é controlado
      if (!isControlledStock) return;

      if (!(requestedQty > 0)) return;

      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = setTimeout(() => {
        if (fetchAbortRef.current) fetchAbortRef.current.abort();

        const reqId = ++requestIdRef.current;
        setLoading(true);

        const controller = new AbortController();
        fetchAbortRef.current = controller;

        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
          try { controller.abort(); } catch { }
        }, 8000);

        if (!isOutOfStock) {
          fetchProductsStock(color, size, controller.signal, reqId);
        }
      }, delayMs);
    },
    [requestedQty, fetchProductsStock, isControlledStock, isOutOfStock]
  );

  // ======= Handlers =======
  const handleDescriFull = useCallback(() => setDescriFull((v) => !v), []);
  const handleMouseEnter = useCallback((imgSrc: string) => setCurrentImage(imgSrc), []);

  const handleColorSelect = useCallback(
    (color: string) => {
      setSelectedColor(color);
      scheduleFetch(color, selectedSize);
    },
    [scheduleFetch, selectedSize]
  );

  const handleSizeSelect = useCallback(
    (size: string) => {
      setSelectedSize(size);
      scheduleFetch(selectedColor, size);
    },
    [scheduleFetch, selectedColor]
  );

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQtdMsg(false);
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        setQuantity(value);
        scheduleFetch(selectedColor, selectedSize);
      }
    },
    [scheduleFetch, selectedColor, selectedSize]
  );

  const decQty = useCallback(() => {
    if (loading) return;
    const qty = parseInt(quantity || "0", 10);
    if (qty > 1) {
      const newQty = qty - 1;
      setQuantity(String(newQty));
      setQtdMsg(false);
      scheduleFetch(selectedColor, selectedSize);
    }
  }, [loading, quantity, scheduleFetch, selectedColor, selectedSize]);

  const incQty = useCallback(() => {
    if (loading) return;
    const qty = parseInt(quantity || "0", 10);
    const newQty = qty + 1;
    setQuantity(String(newQty));
    setQtdMsg(false);
    scheduleFetch(selectedColor, selectedSize);
  }, [loading, quantity, scheduleFetch, selectedColor, selectedSize]);

  const handleAddToCart = useCallback(() => {
    try {
      if (!requestedQty || requestedQty <= 0) {
        setQtdMsg(true);
        return;
      }

      // 1) Personalização (pega a primeira selecionada – ajuste se quiser exigir 1 por grupo)
      const selectedFirst = Object.values(selectedPersonalizations).find(p => p !== null) || null;

      // 2) Validação do arquivo (opcional)
      if (file) {
        const maxBytes = 15 * 1024 * 1024; // 15MB
        const allowed = [
          "image/png",
          "image/jpeg",
          "application/pdf",
          "image/svg+xml",
          "application/postscript",
          "application/vnd.corel-draw",
        ];
        if (!allowed.includes(file.type)) {
          setFileError("Formato não suportado. Envie PNG, JPG, PDF, AI, CDR ou SVG.");
          return;
        }
        if (file.size > maxBytes) {
          setFileError("Arquivo muito grande. Tamanho máximo: 15MB.");
          return;
        }
      }

      // 3) ID determinístico inclui cor, tamanho e chaves de personalização
      const personalizationKeys = Object.values(selectedPersonalizations)
        .filter((p): p is Personalizacao => p !== null)
        .map(p => p.chavePersonal)
        .sort()
        .join("_");

      const id = `${ProductData.codePro}_${selectedColor}_${selectedSize || "nosize"}_${personalizationKeys || "std"}`;

      // 4) Monta o payload LEVE para o carrinho (100% tipado)
      const item: CartItemInput = {
        id,
        codPro: ProductData.codePro,
        chavePro: ProductData.chavePro,

        productName: ProductData.product,
        alt: ProductData.alt,

        color: selectedColor,
        size: selectedSize,

        unitPriceBase: ProductData.price,
        unitPricePersonalization: personalizationUnit,
        unitPriceEffective: effectiveUnitPrice,

        quantity: requestedQty,
        subtotal: requestedQty * effectiveUnitPrice,

        hasPersonalization: !!selectedFirst,
        personalization: selectedFirst
          ? {
            chavePersonal: selectedFirst.chavePersonal,
            descricao: selectedFirst.descrWebPersonal || selectedFirst.descrPersonal || "Personalização",
            precoUnitario: personalizationUnit,
            precoTotal: personalizationUnit * requestedQty,
          }
          : undefined,

        // opcionais leves de logística (mantidos como number|string)
        peso: ProductData.peso,
        altura: ProductData.altura,
        largura: ProductData.largura,
        comprimento: ProductData.comprimento,

        // thumb opcional para minicart
        thumb: ProductData.images?.[0],
      };

      // 5) Adiciona ao carrinho (sem any, sem duplicar chamadas)
      addProduct(item);

      onClose();
      toast.success("Produto adicionado ao carrinho!");
    } catch {
      toast.alert("Ops... Falha ao adicionar produto!");
    }
  }, [
    ProductData.alt,
    ProductData.altura,
    ProductData.chavePro,
    ProductData.codePro,
    ProductData.comprimento,
    ProductData.images,
    ProductData.largura,
    ProductData.peso,
    ProductData.price,
    ProductData.product,
    addProduct,
    effectiveUnitPrice,
    onClose,
    personalizationUnit,
    requestedQty,
    selectedColor,
    selectedPersonalizations,
    selectedSize,
    toast,
    file,
  ]);


  // const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     const file = e.target.files[0];
  //     setFile(file);
  //     setFileError(null);
  //     setFilePreviewUrl(URL.createObjectURL(file));
  //   }
  // }, []);

  // const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  // }, []);

  // const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (e.dataTransfer.files) {
  //     const file = e.dataTransfer.files[0];
  //     setFile(file);
  //     setFileError(null);
  //     setFilePreviewUrl(URL.createObjectURL(file));
  //   }
  // }, []);

  const canBuy = hasQty && (!ProductData.qtdMinPro || requestedQty >= Number(ProductData.qtdMinPro)) && hasGravacao;

  // Adicione esta função para calcular o preço da personalização
  // const calculatePersonalizationPrice = useCallback((
  //   personalization: Personalizacao,
  //   quantity: number
  // ): number => {
  //   if (!personalization.precos || personalization.precos.length === 0) return 0;

  //   // Encontra o preço que corresponde à faixa de quantidade
  //   const priceRange = personalization.precos.find(preco => {
  //     const minQty = parseInt(preco.qtdiPersonalPrc, 10) || 0;
  //     const maxQty = parseInt(preco.qtdfPersonalPrc, 10) || Number.MAX_SAFE_INTEGER;
  //     return quantity >= minQty && quantity <= maxQty;
  //   });

  //   return priceRange ? parseFloat(priceRange.vluPersonalPrc) || 0 : 0;
  // }, []);


  // Função para manipular a seleção de personalizações
  const handlePersonalizationSelect = useCallback((groupId: string, personalization: Personalizacao | null) => {
    setSelectedPersonalizations(prev => ({
      ...prev,
      [groupId]: personalization
    }));
  }, []);

  const findPriceForQuantity = (quantity: number) => {
    if (!ProductData.precos || ProductData.precos.length === 0) {
      //Retorna um objeto de preço padrão usando vluGrid quando não existem intervalos de preço.
      return {
        qtdiProPrc: '1',
        qtdfProPrc: '0',
        vluProPrc: ProductData.vluGridPro || '0'
      };
    }

    // Se a quantidade for 0 ou não for fornecida, retorne a primeira faixa de preço.
    if (!quantity || quantity === 0) {
      return {
        ...ProductData.precos[0],
        vluProPrc: ProductData.vluGridPro || ProductData.precos[0].vluProPrc
      };
    }

    // Se encontrar faixa de preço 
    const foundPrice = ProductData.precos.find(price =>
      quantity >= parseInt(price.qtdiProPrc) &&
      (price.qtdfProPrc === '0' || quantity <= parseInt(price.qtdfProPrc))
    );

    //Se nenhum intervalo correspondente for encontrado, retorne o primeiro intervalo de preços com vluGridPro como alternativa.
    return foundPrice || {
      ...ProductData.precos[0],
      vluProPrc: ProductData.vluGridPro || ProductData.precos[0].vluProPrc
    };
  };




  return (
    <div className="fixed inset-0 flex items-center justify-center z-40">
      <div className="h-full w-full bg-modalProduct-overlay/50 fixed left-0 top-0 z-50" onClick={onClose} />
      <div className="scrollbar w-[94%] lg:w-screen h-[90dvh] lg:h-[80dvh] 2xl:h-[85dvh] 2xl:max-w-7xl lg:max-w-5xl py-4 md:py-8 mt-12 rounded-xl bg-modalProduct-bgModal z-50 fixed flex flex-col lg:flex-row overflow-y-auto">
        <button
          type="button"
          className="bg-modalProduct-bgModal w-8 h-8 absolute right-2 top-2 flex justify-center items-center rounded-full z-50"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <X className="text-red-700 hover:text-red-800 cursor-pointer" aria-hidden size={28} />
        </button>

        {ProductData.promotion && (
          <div className="flex items-center absolute top-4 left-4 font-montserrat font-bold text-sm md:text-xl text-green-600">
            <Tag className="md:size-8 size-4" />-{ProductData.percent_discont}%
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute -left-12 top-14 -rotate-45 bg-red-500 text-white text-xs md:text-sm font-bold tracking-wide shadow-lg px-20 py-2 z-20 select-none pointer-events-none">
            ESGOTADO
          </div>
        )}

        {/* Imagem principal + miniaturas */}
        <div className="w-full lg:w-[50%] h-fit lg:h-full flex relative flex-col items-center justify-center p-2 lg:p-4 rounded-lg">
          <div className="w-40 h-40 lg:w-80 lg:h-80 object-cover cursor-zoom-in overflow-hidden border-primary shadow-md rounded-xl relative" onClick={() => setZoomModal(true)}>
            <Image
              className="w-full h-full"
              src={currentImage}
              alt={ProductData.alt}
              width={300}
              height={300}
              quality={100}
              priority
            />
          </div>
          <div className="flex items-center justify-center relative h-fit lg:max-w-[400px] lg:w-[400px] w-[250px]">
            <ChevronLeft size={32} className="hidden md:visible absolute -left-2 top-1/1" aria-hidden />
            <div className="w-[90%] lg:w-350px p-2 lg:mt-2 flex gap-2 lg:gap-4 justify-start relative overflow-x-auto scrollbar">
              {ProductData.images.map((image, index) => (
                <Image
                  key={image}
                  src={image}
                  width={64}
                  height={64}
                  quality={75}
                  alt={`Product image ${index}`}
                  className={`md:w-16 w-12 lg:w-24 cursor-pointer rounded-lg ${currentImage === image ? "border-2 border-primary" : ""
                    }`}
                  onMouseEnter={() => handleMouseEnter(image)}
                />
              ))}
            </div>
            <ChevronRight size={32} className="hidden md:visible absolute -right-2 top-1/1" aria-hidden />
          </div>
          {/* Personalização */}
          <div className="w-full mt-4 p-3 rounded-lg bg-whiteReference border border-gray-200 pointer-events-none">
            <p className="font-bold mb-2">Personalize seu produto</p>
            <p className="text-xs text-gray-600 mb-3">Envie o arquivo de arte para gravação (PNG, JPG, PDF, AI, CDR, SVG). Máx. 15MB.</p>

            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                const maxBytes = 15 * 1024 * 1024;
                const allowed = ["image/png", "image/jpeg", "application/pdf", "image/svg+xml", "application/postscript", "application/vnd.corel-draw"];
                if (!allowed.includes(f.type)) {
                  setFile(null); setFilePreviewUrl(null);
                  setFileError("Formato não suportado. Envie PNG, JPG, PDF, AI, CDR ou SVG.");
                  return;
                }
                if (f.size > maxBytes) {
                  setFile(null); setFilePreviewUrl(null);
                  setFileError("Arquivo muito grande. Tamanho máximo: 15MB.");
                  return;
                }
                setFileError(null);
                setFile(f);
                if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
                const isImage = f.type.startsWith("image/");
                setFilePreviewUrl(isImage ? URL.createObjectURL(f) : null);
              }}
              className="w-full border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => document.getElementById("art-file-input")?.click()}
            >
              {file ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {filePreviewUrl ? (
                      <Image src={filePreviewUrl} alt="prévia" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs">{file.type.split("/")[1]?.toUpperCase() || "ARQ"}</div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[200px]" title={file.name}>{file.name}</p>
                      <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (filePreviewUrl) { URL.revokeObjectURL(filePreviewUrl); setFilePreviewUrl(null); } }}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-700">
                  Arraste e solte o arquivo aqui, ou <span className="text-primary underline">clique para selecionar</span>
                </div>
              )}
              <input
                id="art-file-input"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr,.svg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const maxBytes = 15 * 1024 * 1024;
                  const allowed = ["image/png", "image/jpeg", "application/pdf", "image/svg+xml", "application/postscript", "application/vnd.corel-draw"];
                  if (!allowed.includes(f.type)) {
                    setFile(null); setFilePreviewUrl(null);
                    setFileError("Formato não suportado. Envie PNG, JPG, PDF, AI, CDR ou SVG.");
                    return;
                  }
                  if (f.size > maxBytes) {
                    setFile(null); setFilePreviewUrl(null);
                    setFileError("Arquivo muito grande. Tamanho máximo: 15MB.");
                    return;
                  }
                  setFileError(null);
                  setFile(f);
                  if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
                  const isImage = f.type.startsWith("image/");
                  setFilePreviewUrl(isImage ? URL.createObjectURL(f) : null);
                }}
              />
            </div>
            {fileError && <p className="text-xs text-red-600 mt-2">{fileError}</p>}
          </div>
        </div>

        {/* Detalhes e ações */}
        <div className="lg:w-[60%] w-[100%] h-fit min-h-full flex flex-col gap-1 2xl:gap-2 items-start px-4 pt-2 mx-auto">
          <p className="text-blackReference text-md md:text-md 2xl:text-lg font-semibold max-w-[90%] text-primary">
            {ProductData.product}
          </p>

          <p className="text-blackReference scrollbar text-sm md:text-md 2xl:text-md font-Roboto max-w-[90%] ">
            {descriFull ? ProductData.description : (ProductData.description.length > 40 ? `${ProductData.description.substring(0, 40)}...` : ProductData.description)}
          </p>

          <button type="button" className="text-primary text-xs cursor-pointer flex" onClick={handleDescriFull}>
            {descriFull ? <>Ocultar descrição completa <ChevronUp size={18} /></> : <>Ver descrição completa <ChevronDown size={18} /></>}
          </button>

          <form
            className="flex flex-col items-start w-full gap-2 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
          >
            {ProductData.sizes.length > 0 && (
              <div>
                <label className="font-bold font-Roboto">Tamanho:</label>
                <div className="flex w-full flex-wrap gap-4 mt-1">
                  {ProductData.sizes.map((size) => (
                    <label
                      key={size}
                      className={`px-3 py-2 2xl:px-4 2xl:py-2 rounded-lg cursor-pointer text-sm  ${selectedSize === size ? "bg-modalProduct-button text-white" : "bg-whiteReference hover:bg-modalProduct-hoverButton hover:text-white"
                        }`}
                    >
                      <input
                        type="radio"
                        name="size"
                        value={size}
                        className="hidden"
                        checked={selectedSize === size}
                        onChange={() => handleSizeSelect(size)}
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="font-bold font-Roboto">Cor:</label>
              <div className="flex w-full flex-wrap gap-4 mt-1">
                {ProductData.colors.map((color) => (
                  <label
                    key={color}
                    className={`px-2 py-2 2xl:px-3 rounded-lg cursor-pointer text-xs ${selectedColor === color ? "bg-modalProduct-button text-white" : "bg-whiteReference hover:bg-modalProduct-hoverButton hover:text-white"
                      }`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      className="hidden"
                      checked={selectedColor === color}
                      onChange={() => handleColorSelect(color)}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex w-fit flex-col lg:flex-row flex-wrap gap-4 mt-1">
              {ProductData.gruposPersonalizacoes?.map((group) => (
                <div key={group.chaveContPersonal}>
                  <p className="font-bold font-Roboto text-sm">{group.descrWebContPersonal}</p>
                  <select
                    className="w-full p-2 border border-gray-300 rounded text-xs"
                    value={selectedPersonalizations[group.chaveContPersonal]?.chavePersonal || ""}
                    onChange={(e) => {
                      const selectedKey = e.target.value;
                      const selectedPersonalization = group.personalizacoes.find(
                        p => p.chavePersonal === selectedKey
                      ) || null;
                      handlePersonalizationSelect(group.chaveContPersonal, selectedPersonalization);
                    }}
                  >
                    <option value="">Selecione</option>
                    {group.personalizacoes.map((personalization) => (
                      <option key={personalization.chavePersonal} value={personalization.chavePersonal}>
                        {personalization.descrPersonal}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex flex-col">
              <label className="font-bold font-Roboto" htmlFor="quantity">Quantidade:</label>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  disabled={loading}
                  aria-disabled={loading}
                  onClick={decQty}
                  className="disabled:opacity-50 disabled:cursor-not-allowed w-6 h-6 rounded-full select-none flex items-center justify-center bg-modalProduct-button hover:bg-modalProduct-hoverButton text-modalProduct-textButton"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={18} />
                </button>

                <input
                  className="border-2 pl-2 w-20 h-9 rounded-md outline-modalProduct-border"
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                />

                <button
                  type="button"
                  disabled={loading}
                  aria-disabled={loading}
                  onClick={incQty}
                  className="disabled:opacity-50 disabled:cursor-not-allowed w-6 h-6 rounded-full select-none flex items-center justify-center bg-modalProduct-button hover:bg-modalProduct-hoverButton text-modalProduct-textButton"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={18} />
                </button>
              </div>

              {typeof availableInt === "number" && requestedQty > availableInt && (
                <span className="mt-4 text-red-500">{`Quantidade disponível: ${availableInt}`}</span>
              )}

              <span className={`text-sm pointer-events-none select-none flex gap-6 items-center ${loading ? "opacity-100" : "opacity-0"}`}>
                <span>Consultando Estoque</span>
                <span className="loader" />
              </span>
              <span className="opacity-60 text-sm pointer-events-none select-none mt-2">
                *Quantidade mínima {Number(ProductData.qtdMinPro).toFixed(0) ?? 10} unidades.
              </span>
            </div>

            <div className="flex gap-4 pointer-events-none select-none">

              <div className="flex gap-4 pointer-events-none select-none">
                <div className="flex items-center gap-2">
                  <label className="font-bold select-none" htmlFor="price">Valor unitário:</label>
                  <span className="w-32 p-1 select-none">
                    {(() => {
                      const currentPrice = findPriceForQuantity(Number(quantity) || 0);
                      if (!currentPrice) return 'Selecione uma quantidade';

                      const basePrice = parseFloat(currentPrice.vluProPrc);
                      const personalizationCost = hasGravacao
                        ? sumSelectedPersonalizationsUnitPrice(selectedPersonalizations, Number(quantity) || 1)
                        : 0;

                      return formatPrice(basePrice + personalizationCost);
                    })()}
                  </span>
                </div>

                <div>
                  <label className="font-bold select-none" htmlFor="subtotal">Subtotal:</label>
                  <input
                    className="w-32 p-1 rounded-md select-none"
                    type="text"
                    id="subtotal"
                    value={formatPrice(total)}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {QtdMsg && <span className="text-red-500 text-sm">Digite uma quantidade válida para prosseguir</span>}
            {Number(quantity) < Number(ProductData.qtdMinPro) && Number(quantity) !== 0 && <span className="text-red-500 text-sm">Esse produto é vendido na quantidade mínima de {Number(ProductData.qtdMinPro).toFixed(0)}</span>}

            {isOutOfStock ? (
              <Button type="button" name="BtnAvisar" className="flex gap-2 items-center justify-center select-none bg-orange-400 hover:bg-orange-500 text-white rounded-lg text-sm lg:text-base px-2 py-2 lg:px-4">
                Avise-me quando chegar!
              </Button>
            ) : (
              <Button type="submit" disabled={loading || (!isOutOfStock && qtyInvalid) || !canBuy}
                className="disabled:bg-gray-500 flex gap-2 items-center justify-center cursor-pointer select-none bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm lg:text-base px-2 py-2 lg:px-4"
              >
                <ShoppingCart size={18} /> Comprar
              </Button>
            )}
          </form>

          <div className="mt-6">
            <h3 className="font-bold text-lg mb-3">Tabela de Preços</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd Mín</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd Máx</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unitário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ProductData.precos && ProductData.precos.length > 0 ? (
                    ProductData.precos.map((priceRange, index) => {
                      const personalizationPrice = hasGravacao
                        ? sumSelectedPersonalizationsUnitPrice(selectedPersonalizations, parseInt(priceRange.qtdiProPrc))
                        : 0;

                      return (
                        <tr key={`price-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {parseInt(priceRange.qtdiProPrc).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {priceRange.qtdfProPrc === '999999999'
                              ? '+'
                              : parseInt(priceRange.qtdfProPrc).toLocaleString('pt-BR')}
                          </td>
                          {hasGravacao ? (
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-green-700">
                              {formatPrice(personalizationPrice + parseFloat(priceRange.vluProPrc))}
                            </td>
                          ) : (
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-green-700">
                              {formatPrice(parseFloat(priceRange.vluProPrc))}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={hasGravacao ? 4 : 3} className="px-4 py-4 text-center text-sm text-gray-500">
                        Consulte os preços.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {zoomModal && (
        <ZoomProduct
          productImagens={ProductData.images}
          targetZoom={currentImage}
          closeZoom={() => setZoomModal(false)}
        />
      )}
    </div>
  );
}
