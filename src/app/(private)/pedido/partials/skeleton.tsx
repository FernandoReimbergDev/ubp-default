import { Container } from "@/app/components/Container";

export const SkeletonPedido = () => {
    return (
        <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-18">
            <Container>
                <div className="mx-auto max-w-3xl w-full bg-white rounded-2xl shadow-md p-8 animate-pulse">
                    <div className="h-7 w-40 bg-gray-200 rounded mb-6" />
                    <div className="h-5 w-64 bg-gray-200 rounded mb-2" />
                    <div className="h-5 w-52 bg-gray-200 rounded mb-8" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="h-48 bg-gray-100 rounded-xl" />
                        <div className="h-48 bg-gray-100 rounded-xl" />
                    </div>
                    <div className="h-10 w-48 bg-gray-200 rounded mt-8" />
                </div>
            </Container>
        </div>
    );
};
