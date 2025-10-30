
export function AsideFilter() {
    return (
        <aside className="rounded-lg bg-white shadow-sm p-4">
            <h2 className="mb-3 text-lg font-medium text-gray-900">Filtros</h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Preço</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Mín"
                            className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder="Máx"
                            className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Avaliação</p>
                    <div className="space-y-1 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" /> 4★ e acima
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" /> 3★ e acima
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" /> 2★ e acima
                        </label>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">Disponibilidade</p>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" /> Em estoque
                    </label>
                </div>
                <button className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
                    Aplicar filtros
                </button>
            </div>
        </aside>
    )
}