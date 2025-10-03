export const SkeletonPaymentMethods = () => {
  return (
    <div className="Parcelamento px-4 flex flex-col gap-2">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4" />

      <div className="flex gap-2 flex-col">
        {/* Skeleton para boleto */}
        <div className="flex gap-2 text-sm md:text-base">
          <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex justify-between gap-2 w-full px-2 py-2">
            <div className="flex gap-1 items-center">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Skeleton para opções de cartão de crédito */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-2 text-sm md:text-base">
            <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex justify-between gap-2 w-full px-2 py-2">
              <div className="flex gap-1 items-center">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        ))}

        {/* Skeleton para botão */}
        <div className="mt-8 flex justify-end">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
