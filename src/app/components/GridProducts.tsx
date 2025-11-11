"use client";
import { Button } from "./Button";
import { CardProduto } from "./CardProduct";
import { ModalProduto } from "./ModalProduct";
import { useProducts } from "../Context/ProductsContext";
import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SkeletonCardProduto } from "./SkeletonCardProduto";
import { ProdutosGrid } from "../types/responseTypes";
import { AsideFilter } from "./AsideFilter";

export const GridProducts = ({ searchTerm }: { searchTerm?: string }) => {
  const { products, loading, error } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdutosGrid | null>(null);

  const [filters, setFilters] = useState({
    priceRange: null as [number, number] | null,
    priceMin: null as number | null,
    priceMax: null as number | null,
    qtyRange: null as [number, number] | null,
    qtyMin: null as number | null,
    qtyMax: null as number | null,
    categories: [] as string[],
    types: { personalizaveis: false, preGravados: false },
    inStock: false,
  });

  const openModal = (produto: ProdutosGrid) => {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  const handleButtonBuy = (product: ProdutosGrid) => {
    openModal(product);
  };


  // 🔎 Pega personalizações + faixas de preço
  // Update the function signature to accept Produto instead of ProdutosGrid
  // const processPersonalizations = (product: Produto) => {
  //   if (!product.gruposPersonalizacoes?.length) return [];

  //   return product.gruposPersonalizacoes.flatMap((grupo) => {
  //     if (!grupo.personalizacoes?.length) return [];

  //     return grupo.personalizacoes.map((personalizacao) => {
  //       const ranges = personalizacao.precos?.map((preco) => ({
  //         qtdi: toNumber(preco.qtdiPersonalPrc),
  //         qtdf: toNumber(preco.qtdfPersonalPrc),
  //         vlwpersonal: toNumber(preco.vluPersonalPrc),
  //       })) ?? [];

  //       return {
  //         groupId: grupo.chaveContPersonal,
  //         groupName: grupo.descrWebContPersonal,
  //         chavePersonal: personalizacao.chavePersonal,
  //         code: personalizacao.codPersonal,
  //         name: personalizacao.descrWebPersonal,
  //         description: personalizacao.descrPersonal,
  //         isDefault: personalizacao.padraoPersonalPro === "1",
  //         isOptional: personalizacao.opcionalPersonal === "1",
  //         maxQuantity: personalizacao.qtdMaxPersonalPro ? Number(personalizacao.qtdMaxPersonalPro) : null,
  //         prices: ranges,
  //       };
  //     });
  //   });
  // };

  const produtosAdaptados = useMemo(() => {
    return products.map((pro, index) => {
      const imagensValidas =
        pro.imagens
          ?.map((img) => img.urlProImgSuper || img.urlProImg || "")
          .filter((url) => url !== "") || [];
      return {
        id: index,
        codePro: pro.codPro,
        chavePro: pro.chavePro,
        product: pro.descrWeb,
        description:
          pro.descr2 ||
          pro.descrWeb ||
          pro.descrWeb2 ||
          pro.descrCompilada ||
          "",
        price: Number(pro.precos?.[0]?.vluProPrc || 0), // preço base do produto
        srcFrontImage: imagensValidas[0] || "/placeholder.jpg",
        srcBackImage: imagensValidas[1] || imagensValidas[0] || "/placeholder.jpg",
        images: imagensValidas,
        alt: `imagem do produto ${pro.codPro}`,
        colors: pro.cores?.map((cor) => cor.descrProCor) || [],
        sizes: [],
        quantidadeEstoquePro: pro.quantidadeEstoquePro || "0",
        estControl: pro.estControl || "0",
        peso: pro.peso || "0",
        altura: pro.altura || "0",
        largura: pro.largura || "0",
        comprimento: pro.comprimento || "0",
        qtdMinPro: pro.qtdMinPro || "1",
        vluGridPro: pro.vluGridPro || pro.precos?.[0]?.vluProPrc || "0",
        gruposPersonalizacoes: pro.gruposPersonalizacoes || [],
        precos: pro.precos || [],
      };
    });
  }, [products]);




  const num = (v: unknown): number => {
    if (v == null) return NaN;
    const s = String(v).trim();
    if (!s) return NaN;
    if (s.includes(",") && !s.includes(".")) return Number(s.replace(/\./g, "").replace(",", "."));
    return Number(s);
  };

  const filtered = useMemo(() => {
    const term = (searchTerm ?? "").trim().toLowerCase();
    return produtosAdaptados.filter((p) => {
      // filtro por termo (quando houver)
      if (term) {
        const name = (p.product || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const code = (p.codePro || "").toLowerCase();
        const matches = name.includes(term) || desc.includes(term) || code.includes(term);
        if (!matches) return false;
      }

      // preço
      const price = Number.isFinite(Number(p.vluGridPro)) ? Number(p.vluGridPro) : Number(p.price || 0);
      if (filters.priceRange) {
        const [a, b] = filters.priceRange;
        if (!(price >= a && price <= b)) return false;
      }
      if (filters.priceMin != null && price < filters.priceMin) return false;
      if (filters.priceMax != null && price > filters.priceMax) return false;

      // quantidade
      const minQty = num(p.qtdMinPro);
      const qtyValue = Number.isFinite(minQty) ? minQty : undefined;
      if (filters.qtyRange && qtyValue !== undefined) {
        const [qa, qb] = filters.qtyRange;
        if (!(qtyValue >= qa && qtyValue <= qb)) return false;
      }
      if (filters.qtyMin != null && qtyValue !== undefined && qtyValue < filters.qtyMin) return false;
      if (filters.qtyMax != null && qtyValue !== undefined && qtyValue > filters.qtyMax) return false;

      // disponibilidade
      if (filters.inStock) {
        const estCtrl = p.estControl === "1";
        const saldo = num(p.quantidadeEstoquePro);
        const available = estCtrl ? Number.isFinite(saldo) && saldo > 0 : true;
        if (!available) return false;
      }

      return true;
    });
  }, [produtosAdaptados, filters, searchTerm]);

  if (loading) {
    return (
      <main className="p-1 md:p-4 min-w-[320px] min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
            <aside className="rounded-lg bg-white shadow-sm p-4 animate-pulse space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="space-y-3">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1/2 bg-gray-200 rounded" />
                  <div className="h-8 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-9 w-full bg-gray-200 rounded" />
            </aside>

            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              <div className="w-full containerProdutos justify-start grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8 justify-items-center items-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCardProduto key={i} />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }
  if (error)
    return <p>Ops! Desculpe, Não conseguimos carregar os produtos no momento. Por favor, atualize a página e tente novamente</p>;


  return (
    <main className="p-1 md:p-4 min-w-[320px] w-full min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
      <div className="mx-auto w-full max-w-7xl space-y-6">

        <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">

          <AsideFilter
            value={filters}
            onChange={setFilters}
            onClear={() => setFilters({
              priceRange: null,
              priceMin: null,
              priceMax: null,
              qtyRange: null,
              qtyMin: null,
              qtyMax: null,
              categories: [],
              types: { personalizaveis: false, preGravados: false },
              inStock: false,
            })}
            onApply={() => void 0}
          />

          <div className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-600">Mostrando {filtered.length} de {produtosAdaptados.length} itens</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar por</span>
                <select className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                  <option>Mais vendidos</option>
                  <option>Menor preço</option>
                  <option>Maior preço</option>
                  <option>Melhor avaliação</option>
                  <option>Novidades</option>
                </select>
              </div>
            </div>

            <div className="w-full containerProdutos justify-start grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8 justify-items-center items-center">
              {filtered.map((produto, index) => (
                <div key={`${produto.codePro}-${index}`} className="produto-container">
                  <CardProduto
                    click={() => handleButtonBuy(produto)}
                    srcFront={produto.srcFrontImage}
                    alt={produto.alt}
                    nameProduct={produto.product}
                    priceProduct={Number(produto.vluGridPro)}
                    stock={produto.quantidadeEstoquePro}
                    estControl={produto.estControl}
                    promotion={false}
                    percent_discont={0}
                    btn={
                      <Button
                        onClick={() => handleButtonBuy(produto)}
                        className="flex items-center justify-center w-[50px] xl:w-[50px] min-h-8 md:min-h-[35px] cursor-pointer bg-Button-bg hover:bg-Slider-bgDegrade rounded-md text-white text-sm"
                        name="buttonBuy"
                      >
                        <ShoppingCart size={18} />
                      </Button>
                    }
                  />
                </div>
              ))}
            </div>


            <div className="flex items-center justify-center gap-2">
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                Anterior
              </button>
              <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">1</button>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">2</button>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">3</button>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                Próximo
              </button>
            </div>
          </div>
        </section>
        {isModalOpen && selectedProduct && (
          <ModalProduto
            ProductData={{
              ...selectedProduct,
              precos: selectedProduct.precos || [] // Add default empty array if precos is undefined
            }}
            onClose={closeModal}
          />
        )}

      </div>
    </main>
  );
};
