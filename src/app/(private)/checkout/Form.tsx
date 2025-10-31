"use client";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { DadosEntregaFormData, DadosPagamentoSchema } from "./schema";
import { handleMaskCard } from "@/app/services/utils";
import chip from "./assets/chip.png";
import nfc from "./assets/nfc.png";
import Image from "next/image";
import { InputField, InputIcon, InputRoot } from "@/app/components/Input";
import { CalendarCheck, Lock } from "lucide-react";

export function FormPagamento() {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<DadosEntregaFormData>({
    resolver: yupResolver(DadosPagamentoSchema),
    mode: "onChange",
  });
  const [cardBrand, setCardBrand] = useState<string>("desconhecido");

  const handleCardNumberChange = async (value: string) => {
    const result = await handleMaskCard(value, setValue, trigger, setError, clearErrors, "card_number");
    if (result) {
      setCardBrand(result.brand);
    }
  };

  const onSubmit: SubmitHandler<DadosEntregaFormData> = async (data) => {
    setSubmitting(true);
    try {
      //   const status = await putEntrega(chave_entrega, data);
      const status = 200;

      if (status === 200) {
        console.log("Formulário enviado com sucesso!", data);
        setSubmitting(true);
        // router.push("/pagina-de-sucesso");
      } else {
        console.error(`Erro ao enviar o formulário: Status ${status}`);
        alert(`Erro ao enviar o formulário. Status: ${status}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao enviar o formulário. Verifique os dados e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="p-2 w-full">
        <div className="w-full max-w-[95%] md:max-w-[92%] h-fit mx-auto flex flex-col justify-start items-center gap-1 ">
          <h1 className="text-lg 2xl:text-xl font-bold font- text-gray-600 text-center">
            Efetue o pagamento para concluir o pedido
          </h1>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(200px,350px)] gap-4">
        <form method="POST" onSubmit={handleSubmit(onSubmit)}>
          <section className="grid md:grid-cols-1 gap-2 md:gap-4 bg-white mb-2 mt-8">
            <div className="px-2">
              <label className="block text-sm 2xl:text-md font-medium text-gray-700 mb-2">Número do Cartão</label>
              <InputRoot data-error={!!errors.card_number}>
                <InputIcon>
                  {cardBrand && (
                    <span>
                      <Image src={`/images/cards/${cardBrand}.png`} alt={cardBrand} width={40} height={40} />
                    </span>
                  )}
                </InputIcon>
                <InputField
                  {...register("card_number")}
                  type="text"
                  placeholder="1234 1234 1234 1234"
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  id="card_number"
                  maxLength={19}
                />
              </InputRoot>
              {errors.card_number && <span className="text-red-500 text-xs">{errors.card_number.message}</span>}
            </div>
            <div className="px-2 gap-2 justify-center lg:flex lg:items-center">
              <div className="w-full lg:w-1/2">
                <label className="block text-sm 2xl:text-md font-medium text-gray-700 mb-2">Data de Expiração</label>
                <InputRoot data-error={!!errors.expiry_date}>
                  <InputIcon>
                    <CalendarCheck />
                  </InputIcon>
                  <InputField
                    {...register("expiry_date")}
                    type="text"
                    placeholder="10/26"
                    id="expiry_date"
                    maxLength={5}
                  />
                </InputRoot>
                {errors.expiry_date && <span className="text-red-500 text-xs">{errors.expiry_date.message}</span>}
              </div>
              <div className="w-full lg:w-1/2 mt-4 lg:mt-0">
                <label className="block text-sm 2xl:text-md font-medium text-gray-700 mb-2">CVC</label>
                <InputRoot data-error={!!errors.cvc_number}>
                  <InputIcon>
                    <Lock />
                  </InputIcon>
                  <InputField
                    {...register("cvc_number")}
                    type="text"
                    inputMode="numeric"
                    placeholder="456"
                    id="cvc_number"
                    maxLength={3}
                  />
                </InputRoot>
                {errors.cvc_number && <span className="text-red-500 text-xs">{errors.cvc_number.message}</span>}
              </div>
            </div>

            <div className="px-2">
              <label className="block text-sm 2xl:text-md font-medium text-gray-700 mb-2">
                Nome impresso no Cartão
              </label>
              <InputRoot data-error={!!errors.cardholder_name}>
                <InputField
                  id="cardholder_name"
                  {...register("cardholder_name")}
                  type="text"
                  placeholder="Jõao B. silva"
                />
              </InputRoot>
              {errors.cardholder_name && <span className="text-red-500 text-xs">{errors.cardholder_name.message}</span>}
            </div>
          </section>
          <section className="grid md:grid-cols-1 gap-2 2xl:gap-8 py-2 bg-white ">
            <div className="px-2">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-md cursor-pointer  ${submitting ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-400"
                  } text-white text-xs 2xl:text-sm`}
              >
                {submitting ? `'ENVIANDO...'` : "FINALIZAR COMPRA"}
              </button>
            </div>
          </section>
        </form>
        <div className="containerCard">
          <div className="card mx-auto mt-8 bg-gradient-to-b from-slate-50 to-slate-200 shadow-xl rounded-2xl h-96 w-62 relative overflow-hidden">
            <div className="w-[500px] h-[500px] border-2 rounded-full border-gray-300 absolute top-28"></div>
            <div className="w-[500px] h-[500px] border-2 rounded-full border-gray-300 absolute top-16"></div>
            <Image
              height={50}
              width={50}
              alt="imagem do chip do cartao de credito"
              src={chip}
              className="rotate-90 absolute left-4 top-8"
            />
            <Image
              height={50}
              width={50}
              alt="imagem do chip do cartao de credito"
              src={nfc}
              className="-rotate-90 absolute right-4 top-8"
            />
            <div className="absolute bottom-28 left-8">João B. Silva</div>
            <div className="absolute bottom-20 left-8 text-xl">**** **** **** {3456}</div>
            <div className="absolute bottom-8 left-8">09/22</div>
            <div className="absolute bottom-8 right-4">
              <Image
                height={50}
                width={50}
                alt="imagem do chip do cartao de credito"
                src={`/images/cards/${"Mastercard"}.png`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
