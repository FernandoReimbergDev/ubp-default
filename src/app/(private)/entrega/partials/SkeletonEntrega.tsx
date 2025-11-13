import { Container } from "@/app/components/Container";
import { StepsPurchase } from "@/app/components/StepsPayment";

export const SkeletonEntrega = () => {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <StepsPurchase step="Entrega" />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <div className="h-fit w-full px-2 relative z-40">
            <header className="p-2">
              <div className="w-full max-w-[95%] md:max-w-[92%] h-fit mx-auto flex flex-col justify-start items-center gap-1 z-50 relative">
                <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </header>

            {/* Skeleton do formulário */}
            <div className="w-full">
              <div className="h-5 w-56 bg-gray-200 rounded animate-pulse mb-4 px-2" />

              {/* Skeleton dos endereços */}
              <section className="flex flex-col flex-wrap 2xl:flex-row 2xl:items-center gap-4 mt-2 mb-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2 px-2">
                    <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </section>

              {/* Skeleton dos campos do formulário */}
              <section className="grid md:grid-cols-2 gap-2 md:gap-4 bg-white">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="px-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </section>

              {/* Skeleton do botão */}
              <section className="grid md:grid-cols-1 gap-2 2xl:gap-4 bg-white mt-4">
                <div className="p-2">
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </section>
            </div>
          </div>

          {/* Skeleton do resumo */}
          <div className="w-full lg:w-full lg:max-w-80 h-full border-t lg:border-t-0 lg:border-l border-gray-300 px-2 mt-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-6 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
