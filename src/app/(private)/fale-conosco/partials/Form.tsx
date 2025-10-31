"use client";

import { fetchAddressFromCep, handleCnpjCpfMask, handlePhoneMask } from "@/app/services/utils";
import { useCallback, useEffect, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { SubmitHandler, useForm } from "react-hook-form";
import { MeusDadosFormData, MeusDadosSchema } from "./schema";
import { useRouter } from "next/navigation";
import { UsuarioResponse } from "./types"; // trocar essa typagem pela correta criar uma e resolve o erro setvalue

export function FormFaleConosco() {
  const router = useRouter();
  const [clientData, setClientData] = useState<UsuarioResponse>({
    success: false,
    message: "",
    result: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<MeusDadosFormData>({
    resolver: yupResolver(MeusDadosSchema),
    mode: "onChange",
  });

  const cep = watch("cep");

  const fetchUserData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/list-user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Erro ao buscar Id do usuário");
      }

      setClientData(result);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("error ao requisitar Id do usuário para api externa", error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (!clientData) return;

    const { result } = clientData;
    if (!Array.isArray(result) || result.length === 0) return;

    const { email, phones } = result[0];

    if (Array.isArray(phones) && phones.length > 0) {
      phones.map((tel) => {
        if (tel?.number) {
          handlePhoneMask(tel.number, setValue, trigger, setError, clearErrors);
        }
        return null;
      });
    }
    //EMAIL
    if (email) setValue("email", email);
  }, [clientData, setValue, trigger, setError, clearErrors]);

  useEffect(() => {
    if (cep?.length === 9) {
      fetchAddressFromCep(cep, setValue, trigger, setError, clearErrors);
    }
  }, [cep, setValue, trigger, setError, clearErrors]);

  const onSubmit: SubmitHandler<MeusDadosFormData> = async () => {
    setSubmitting(true);
    try {
      //   const status = await putEntrega(chave_entrega, data);
      const status = 200;

      if (status === 200) {
        setSubmitting(true);
        router.push("/forma-de-pagamento");
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
    <div className="h-fit w-full px-2 relative z-40">
      <header className="p-2">
        <div className="w-full max-w-[95%] md:max-w-[92%] h-fit mx-auto flex flex-col justify-start items-center gap-1 z-50 relative"></div>
      </header>
      <div>
        <form method="POST" onSubmit={handleSubmit(onSubmit)}>
          <section className="grid md:grid-cols-2 gap-2 md:gap-4 bg-white mb-2 items-start">
            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Razão Social</label>
              <input
                type="text"
                id="razao_social"
                {...register("razao_social")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.razao_social
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.razao_social && <span className="text-red-500 text-xs">{errors.razao_social.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Nome completo</label>
              <input
                type="text"
                id="nome_completo"
                {...register("fullName")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>

            <div>
              <div className="w-full flex gap-4 justify-between items-center">
                <div className="w-[78px] px-2">
                  <label className="block text-xs 2xl:text-sm font-medium text-gray-700">DDD</label>
                  <input
                    type="text"
                    id="ddd"
                    {...register("ddd")}
                    className={`w-[66px] flex-none px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ddd
                      ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                      : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                      }`}
                  />
                </div>
                <div className="px-2 w-full grow">
                  <label className="block text-xs 2xl:text-sm font-medium text-gray-700 ">Telefone</label>
                  <input
                    type="text"
                    id="telefone"
                    {...register("telefone")}
                    placeholder="0000-0000"
                    onChange={(e) => handlePhoneMask(e.target.value, setValue, trigger, setError, clearErrors)}
                    className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.telefone
                      ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                      : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                      }`}
                  />
                </div>
              </div>
              {errors.ddd && <span className="text-red-500 text-xs">{errors.ddd.message}</span>}
              {errors.telefone && <span className="text-red-500 text-xs">{errors.telefone.message}</span>}
              <br />
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CNPJ</label>
              <input
                type="text"
                id="cnpj_cpf"
                {...register("cnpj_cpf")}
                placeholder="00.000.000/0001-00"
                onChange={(e) => handleCnpjCpfMask(e.target.value, setValue, trigger, setError, clearErrors)}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 rounded-md border transition-all duration-150
                                        ${errors.cnpj_cpf
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
                maxLength={18}
              />
              {errors.cnpj_cpf && <span className="text-red-500 text-xs">{errors.cnpj_cpf.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Assunto</label>
              <input
                type="text"
                id="subject"
                {...register("subject")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subject
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.subject && <span className="text-red-500 text-xs">{errors.subject.message}</span>}
            </div>
          </section>
          <section className="grid md:grid-cols-1 gap-2 2xl:gap-8 py-2 bg-white ">
            <div className="flex flex-col mx-auto w-full px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Mensagem:</label>
              <textarea
                id="messageMail"
                {...register("informacoes_complementares")}
                className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="px-2">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-md cursor-pointer  ${submitting ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-400"
                  } text-white text-xs 2xl:text-sm`}
              >
                {submitting ? `'ENVIANDO...'` : "ENVIAR"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
