type Filters = {
    priceRange: [number, number] | null;
    priceMin: number | null;
    priceMax: number | null;
    qtyRange: [number, number] | null;
    qtyMin: number | null;
    qtyMax: number | null;
    categories: string[];
    types: { personalizaveis: boolean; preGravados: boolean };
    inStock: boolean;
};

type Props = {
    value: Filters;
    onChange: (next: Filters) => void;
    onApply?: () => void;
    onClear?: () => void;
};

export function AsideFilter({ value, onChange, onApply, onClear }: Props) {
    const toggleCategory = (cat: string) => {
        const has = value.categories.includes(cat);
        const categories = has ? value.categories.filter((c) => c !== cat) : [...value.categories, cat];
        onChange({ ...value, categories });
    };

    const handlePriceRange = (range: [number, number] | null) => {
        onChange({ ...value, priceRange: range });
    };
    const handleQtyRange = (range: [number, number] | null) => {
        onChange({ ...value, qtyRange: range });
    };

    return (
        <aside className="rounded-lg bg-white shadow-sm p-4">
            <h2 className="mb-3 text-lg font-medium text-gray-900">Filtros</h2>
            <div className="space-y-6">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Preço</p>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                        {(
                            [
                                { label: "Até R$ 100", v: [0, 100] as [number, number] },
                                { label: "R$ 100 a R$ 300", v: [100, 300] as [number, number] },
                                { label: "R$ 300 a R$ 600", v: [300, 600] as [number, number] },
                                { label: "Acima de R$ 600", v: [600, 999999] as [number, number] },
                            ]
                        ).map((opt) => (
                            <label key={opt.label} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="priceRange"
                                    checked={value.priceRange?.[0] === opt.v[0] && value.priceRange?.[1] === opt.v[1]}
                                    onChange={() => handlePriceRange(opt.v)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Mín"
                            value={value.priceMin ?? ""}
                            onChange={(e) => onChange({ ...value, priceMin: e.target.value ? Number(e.target.value) : null })}
                            className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder="Máx"
                            value={value.priceMax ?? ""}
                            onChange={(e) => onChange({ ...value, priceMax: e.target.value ? Number(e.target.value) : null })}
                            className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Quantidade</p>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                        {(
                            [
                                { label: "1 a 50 un.", v: [1, 50] as [number, number] },
                                { label: "51 a 200 un.", v: [51, 200] as [number, number] },
                                { label: "201 a 500 un.", v: [201, 500] as [number, number] },
                                { label: "500+ un.", v: [501, 999999] as [number, number] },
                            ]
                        ).map((opt) => (
                            <label key={opt.label} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="qtyRange"
                                    checked={value.qtyRange?.[0] === opt.v[0] && value.qtyRange?.[1] === opt.v[1]}
                                    onChange={() => handleQtyRange(opt.v)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Mín"
                            value={value.qtyMin ?? ""}
                            onChange={(e) => onChange({ ...value, qtyMin: e.target.value ? Number(e.target.value) : null })}
                            className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder="Máx"
                            value={value.qtyMax ?? ""}
                            onChange={(e) => onChange({ ...value, qtyMax: e.target.value ? Number(e.target.value) : null })}
                            className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Categorias</p>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                        {[
                            { v: "brindes", label: "Brindes" },
                            { v: "camisetas", label: "Camisetas" },
                            { v: "canecas", label: "Canecas" },
                            { v: "chaveiros", label: "Chaveiros" },
                            { v: "bones", label: "Bonés" },
                            { v: "papelaria", label: "Papelaria" },
                        ].map((c) => (
                            <label key={c.v} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={value.categories.includes(c.v)}
                                    onChange={() => toggleCategory(c.v)}
                                />
                                {c.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Tipo</p>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={value.types.personalizaveis}
                                onChange={(e) => onChange({ ...value, types: { ...value.types, personalizaveis: e.target.checked } })}
                            />
                            Personalizáveis
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={value.types.preGravados}
                                onChange={(e) => onChange({ ...value, types: { ...value.types, preGravados: e.target.checked } })}
                            />
                            Pré-gravados
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Disponibilidade</p>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={value.inStock}
                            onChange={(e) => onChange({ ...value, inStock: e.target.checked })}
                        />
                        Em estoque
                    </label>
                </div>

                <div className="flex gap-2">
                    <button
                        className="w-1/2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => onClear?.()}
                    >
                        Limpar
                    </button>
                    <button
                        className="w-1/2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black  cursor-pointer"
                        onClick={() => onApply?.()}
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </aside>
    );
}