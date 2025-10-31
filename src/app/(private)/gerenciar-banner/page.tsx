// "use client";

// // export const dynamic = 'force-dynamic' // deletar isso depois, somente aprendizado
// // COMPONENTES
// import { Button } from "@/app/components/Button";
// import { Container } from "../../components/Container";
// import { TitleSection } from "../../components/TitleSection";

// // ICONES
// import { Pencil } from "lucide-react";

// // FORM
// import * as React from "react";
// // import { useForm } from "react-hook-form";
// // import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";

// type BannerFormValues = {
//     titulo: string;
//     produto: string;
//     imagem_principal: FileList;
//     imagem_auxiliar: FileList;
// };

// const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// const MAX_IMAGE_SIZE_MB = 5; // 5MB

// const schema: yup.ObjectSchema<BannerFormValues> = yup
//     .object({
//         titulo: yup.string().required("Título é obrigatório"),
//         produto: yup.string().required("Produto é obrigatório"),
//         imagem_principal: yup
//             .mixed<FileList>()
//             .required("Imagem principal é obrigatória")
//             .test("file-required", "Imagem principal é obrigatória", (files) => !!files && files.length > 0)
//             .test("file-type", "Formato inválido (use JPG, PNG ou WEBP)", (files) => {
//                 if (!files || files.length === 0) return false;
//                 return SUPPORTED_IMAGE_TYPES.includes(files[0]?.type as (typeof SUPPORTED_IMAGE_TYPES)[number]);
//             })
//             .test("file-size", `Máx. ${MAX_IMAGE_SIZE_MB}MB`, (files) => {
//                 if (!files || files.length === 0) return false;
//                 return files[0].size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;
//             }),
//         imagem_auxiliar: yup
//             .mixed<FileList>()
//             .required("Imagem auxiliar é obrigatória")
//             .test("file-required", "Imagem auxiliar é obrigatória", (files) => !!files && files.length > 0)
//             .test("file-type", "Formato inválido (use JPG, PNG ou WEBP)", (files) => {
//                 if (!files || files.length === 0) return false;
//                 return SUPPORTED_IMAGE_TYPES.includes(files[0]?.type as (typeof SUPPORTED_IMAGE_TYPES)[number]);
//             })
//             .test("file-size", `Máx. ${MAX_IMAGE_SIZE_MB}MB`, (files) => {
//                 if (!files || files.length === 0) return false;
//                 return files[0].size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;
//             }),
//     })
//     .required();

export default function GerenciarBanner() {
    //   const {
    //     register,
    //     handleSubmit,
    //     formState: { errors, isSubmitting },
    //     reset,
    //   } = useForm<BannerFormValues>({
    //     resolver: yupResolver(schema),
    //     mode: "onBlur",
    //   });

    //   const [principalPreviewUrl, setPrincipalPreviewUrl] = React.useState<string | null>(null);
    //   const [auxiliarPreviewUrl, setAuxiliarPreviewUrl] = React.useState<string | null>(null);

    //   React.useEffect(() => {
    //     return () => {
    //       if (principalPreviewUrl) URL.revokeObjectURL(principalPreviewUrl);
    //       if (auxiliarPreviewUrl) URL.revokeObjectURL(auxiliarPreviewUrl);
    //     };
    //   }, [principalPreviewUrl, auxiliarPreviewUrl]);

    //   function onSubmit(values: BannerFormValues) {
    //     // Aqui você pode montar FormData e enviar para sua API
    //     const formData = new FormData();
    //     formData.append("titulo", values.titulo);
    //     formData.append("produto", values.produto);
    //     formData.append("imagem_principal", values.imagem_principal[0]);
    //     formData.append("imagem_auxiliar", values.imagem_auxiliar[0]);

    //     // TODO: integrar com rota de upload quando existir
    //     console.log("FormData pronta", Object.fromEntries(formData.entries()));
    //     reset();
    //     setPrincipalPreviewUrl(null);
    //     setAuxiliarPreviewUrl(null);
    //   }

    return (
        <>
        </>
        // <div className="bg-body-bg pb-1 pt-16 min-h-screen">
        //   <Container>
        //     <TitleSection text="Editor de Banner" icon={<Pencil size={24} className="text-green-600" />} />

        //     <div className="w-full">
        //       <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        //         <div className="flex flex-col px-2">
        //           <label htmlFor="titulo">Título</label>
        //           <input
        //             type="text"
        //             placeholder="Digite o título"
        //             id="titulo"
        //             className="px-2 py-1 border rounded-md"
        //             {...register("titulo")}
        //           />
        //           {errors.titulo?.message && <span className="text-sm text-red-600 mt-1">{errors.titulo.message}</span>}
        //         </div>

        //         <div className="flex flex-col px-2">
        //           <label htmlFor="produto">Produto</label>
        //           <input
        //             type="text"
        //             placeholder="Digite o nome do produto"
        //             id="produto"
        //             className="px-2 py-1 border rounded-md"
        //             {...register("produto")}
        //           />
        //           {errors.produto?.message && <span className="text-sm text-red-600 mt-1">{errors.produto.message}</span>}
        //         </div>

        //         <div className="flex flex-col px-2">
        //           <label htmlFor="imagem_principal">Imagem Principal</label>
        //           <input
        //             type="file"
        //             id="imagem_principal"
        //             accept={SUPPORTED_IMAGE_TYPES.join(",")}
        //             className="px-2 py-1 border rounded-md"
        //             {...register("imagem_principal")}
        //             onChange={(event) => {
        //               const file = event.target.files && event.target.files[0];
        //               if (file) {
        //                 if (principalPreviewUrl) URL.revokeObjectURL(principalPreviewUrl);
        //                 const url = URL.createObjectURL(file);
        //                 setPrincipalPreviewUrl(url);
        //               } else {
        //                 if (principalPreviewUrl) URL.revokeObjectURL(principalPreviewUrl);
        //                 setPrincipalPreviewUrl(null);
        //               }
        //             }}
        //           />
        //           {errors.imagem_principal?.message && (
        //             <span className="text-sm text-red-600 mt-1">{String(errors.imagem_principal.message)}</span>
        //           )}
        //         </div>

        //         <div className="flex flex-col px-2">
        //           <label htmlFor="imagem_auxiliar">Imagem Auxiliar</label>
        //           <input
        //             type="file"
        //             id="imagem_auxiliar"
        //             accept={SUPPORTED_IMAGE_TYPES.join(",")}
        //             className="px-2 py-1 border rounded-md"
        //             {...register("imagem_auxiliar")}
        //             onChange={(event) => {
        //               const file = event.target.files && event.target.files[0];
        //               if (file) {
        //                 if (auxiliarPreviewUrl) URL.revokeObjectURL(auxiliarPreviewUrl);
        //                 const url = URL.createObjectURL(file);
        //                 setAuxiliarPreviewUrl(url);
        //               } else {
        //                 if (auxiliarPreviewUrl) URL.revokeObjectURL(auxiliarPreviewUrl);
        //                 setAuxiliarPreviewUrl(null);
        //               }
        //             }}
        //           />
        //           {errors.imagem_auxiliar?.message && (
        //             <span className="text-sm text-red-600 mt-1">{String(errors.imagem_auxiliar.message)}</span>
        //           )}
        //         </div>

        //         {(principalPreviewUrl || auxiliarPreviewUrl) && (
        //           <div className="px-2">
        //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        //               <div className="w-full">
        //                 {principalPreviewUrl && (
        //                   <img
        //                     src={principalPreviewUrl}
        //                     alt="Preview imagem principal"
        //                     className="w-full h-64 object-cover rounded-md border"
        //                   />
        //                 )}
        //               </div>
        //               <div className="w-full">
        //                 {auxiliarPreviewUrl && (
        //                   <img
        //                     src={auxiliarPreviewUrl}
        //                     alt="Preview imagem auxiliar"
        //                     className="w-full h-64 object-cover rounded-md border"
        //                   />
        //                 )}
        //               </div>
        //             </div>
        //           </div>
        //         )}

        //         <div className="px-2 w-full sm:w-1/3">
        //           <Button type="submit" disabled={isSubmitting}>
        //             {isSubmitting ? "Enviando..." : "Enviar"}
        //           </Button>
        //         </div>
        //       </form>
        //     </div>
        //   </Container>
        // </div>
    );
}
