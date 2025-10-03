export const SkeletonCardProduto = () => {
    return (
        <div className="w-[150px] md:w-[210px] h-[270px] sm:h-[260px] md:h-[320px] p-2 md:p-4 rounded-xl shadow animate-pulse bg-whiteReference flex flex-col">
            <div className="w-full h-[120px] md:h-[160px] bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-[90%] mb-1" />
            <div className="h-4 bg-gray-200 rounded w-[80%] mb-2" />
            <div className="h-6 bg-gray-200 rounded w-[50%] mt-auto" />
        </div>
    );
};
