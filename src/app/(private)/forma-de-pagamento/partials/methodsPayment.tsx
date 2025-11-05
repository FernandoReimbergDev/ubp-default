// "use client";

// import { useEffect, useState } from "react";
// import { formatPrice } from "@/app/utils/formatter";
// import { Barcode, CreditCard } from "lucide-react";
// import { Juros_composto } from "../../../services/jurosComposto";
// import { useCart } from "@/app/Context/CartContext";
// import { SkeletonPaymentMethods } from "./SkeletonPaymentMethods";
// import { useRouter } from "next/navigation";

// interface MethodsPaymentsProps {
//   onPaymentMethodChange?: (method: string, total: number, installments?: number, installmentValue?: number) => void;
//   limiteParcelamento: number;
//   juros: number;
// }

// export function MethodsPayments({ onPaymentMethodChange, limiteParcelamento, juros }: MethodsPaymentsProps) {
//   const router = useRouter();
//   const { cart } = useCart();
//   const [submitting, setSubmitting] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [valorFrete, setValorFrete] = useState(0);
//   const [valores, setValores] = useState<number[]>([]);
//   const [valoresTotal, setValoresTotal] = useState<number[]>([]);
//   const [selectedPayment, setSelectedPayment] = useState<string>("boleto");
//   const totalCarrinho = cart.reduce(
//     (acc, item) => acc + (item.subtotal ?? parseInt(item.quantity as string, 10) * item.price),
//     0
//   );
//   const totalComFrete = totalCarrinho + valorFrete;

//   useEffect(() => {
//     setValorFrete(58.9);
//   }, []);

//   useEffect(() => {
//     setLoading(true);

//     // Simular um pequeno delay para mostrar o skeleton
//     const timer = setTimeout(() => {
//       const tempParcela: number[] = [];
//       const tempTotal: number[] = [];
//       for (let i = 1; i <= limiteParcelamento; i++) {
//         const parcela = Juros_composto(totalComFrete, i, juros);
//         tempParcela.push(parcela.valor_parcela);
//         tempTotal.push(parcela.total);
//       }
//       setValores(tempParcela);
//       setValoresTotal(tempTotal);
//       setLoading(false);
//     }, 800); // 800ms de delay para mostrar o skeleton

//     return () => clearTimeout(timer);
//   }, [totalComFrete, limiteParcelamento, juros]);

//   const handlePaymentChange = (method: string, installments?: number) => {
//     setSelectedPayment(method);

//     if (method === "boleto") {
//       onPaymentMethodChange?.(method, totalComFrete);
//     } else if (installments !== undefined) {
//       const installmentValue = valores[installments - 1];
//       const totalValue = valoresTotal[installments - 1];
//       onPaymentMethodChange?.(method, totalValue, installments, installmentValue);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);

//     try {
//       const formData = new FormData(e.currentTarget as HTMLFormElement);
//       const paymentMethod = formData.get("parcelas") as string;

//       // Aqui você pode implementar a lógica de envio dos dados
//       console.log("Método de pagamento selecionado:", paymentMethod);
//       console.log("Dados do carrinho:", cart);

//       // Simular delay de envio
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       router.push("/checkout");

//       // Redirecionar para próxima etapa ou mostrar sucesso
//       // alert("Forma de pagamento selecionada com sucesso!");
//     } catch (error) {
//       console.error("Erro ao processar pagamento:", error);
//       alert("Erro ao processar pagamento. Tente novamente.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return <SkeletonPaymentMethods />;
//   }

//   return (
//     <div className="Parcelamento px-4 flex flex-col gap-2">
//       <h3>Opções de pagamento:</h3>

//       <div className="flex gap-2 flex-col">
//         <form onSubmit={handleSubmit}>
//           <div className="flex gap-2 text-sm md:text-base">
//             <input
//               type="radio"
//               name="parcelas"
//               id="boleto"
//               value="boleto"
//               checked={selectedPayment === "boleto"}
//               onChange={() => handlePaymentChange("boleto")}
//               required
//             />
//             <label htmlFor="boleto" className="flex justify-between gap-2 w-full px-2 py-2 cursor-pointer">
//               <div className="flex gap-1">
//                 <Barcode /> Boleto a vista: {formatPrice(totalComFrete)}
//               </div>
//               <p>Total: {formatPrice(totalComFrete)}</p>
//             </label>
//           </div>
//           {valores.map((item, index) => (
//             <div key={index} className="flex gap-2 text-sm md:text-base">
//               <input
//                 type="radio"
//                 name="parcelas"
//                 id={`installment_${index}`}
//                 value={`credit_${index + 1}`}
//                 onChange={() => handlePaymentChange("credit", index + 1)}
//                 required
//               />
//               <label
//                 htmlFor={`installment_${index}`}
//                 className="flex justify-between gap-2 w-full px-2 py-2 cursor-pointer"
//               >
//                 <div className="flex gap-1">
//                   <CreditCard /> Cartão de crédito {index + 1}x de {formatPrice(item)}
//                 </div>
//                 <p>Total: {formatPrice(valoresTotal[index])}</p>
//               </label>
//             </div>
//           ))}
//           <div className="mt-8 flex justify-end">
//             <button
//               type="submit"
//               disabled={submitting}
//               className={`px-4 py-2 rounded-md cursor-pointer  ${submitting ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-400"
//                 } text-white text-xs 2xl:text-sm`}
//             >
//               {submitting ? `'ENVIANDO...'` : "CONTINUAR"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
