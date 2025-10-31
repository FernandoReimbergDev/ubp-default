"use client";

import { fetchAddressFromCep, handleCEPMask, handleCnpjCpfMask, handlePhoneMask } from "@/app/services/utils";
import { useCallback, useEffect, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { SubmitHandler, useForm } from "react-hook-form";
import { MeusDadosFormData, MeusDadosSchema } from "./schema";
import { useRouter } from "next/navigation";
import { UsuarioResponse } from "./types"; // trocar essa typagem pela correta criar uma e resolve o erro setvalue

export function FormMeusDados() {
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

    const { email, cpf, cnpj, phones, addresses } = result[0];

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

    // CPF ou CNPJ
    if (cpf) handleCnpjCpfMask(cpf, setValue, trigger, setError, clearErrors);
    if (cnpj) handleCnpjCpfMask(cnpj, setValue, trigger, setError, clearErrors);

    // Endereço principal (addresses[0])
    if (Array.isArray(addresses) && addresses.length > 0) {
      const endereco = addresses[0];

      handleCEPMask(endereco.zipcode ?? "", setValue, trigger, setError, clearErrors);
      setValue("logradouro", endereco.street ?? "");
      setValue("numero", endereco.number ?? "");
      setValue("complemento", endereco.complement ?? "");
      setValue("bairro", endereco.neighborhood ?? "");
      setValue("municipio", endereco.city ?? "");
      setValue("uf", endereco.id ?? "");
    }
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
            <input type="hidden" id="ibge" {...register("ibge")} />

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
              <div className="px-2">
                <div className="px-2 py-2 flex items-center gap-8 h-fit justify-center self-center border border-gray-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input type="radio" value="PF" id="pessoa_fisica" {...register("entityType")} />
                    <label className="text-xs 2xl:text-sm font-medium text-gray-700">Pessoa Física</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" value="PJ" id="pessoa_juridica" {...register("entityType")} />
                    <label className="text-xs 2xl:text-sm font-medium text-gray-700">Pessoa Jurídica</label>
                  </div>
                </div>
                {errors.entityType && <span className="text-red-500 text-xs">{errors.entityType.message}</span>}
              </div>
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CNPJ / CPF</label>
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
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input
                type="text"
                id="inscricao_estadual"
                {...register("inscricao_estadual")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.inscricao_estadual
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.inscricao_estadual && (
                <span className="text-red-500 text-xs">{errors.inscricao_estadual.message}</span>
              )}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CEP*</label>
              <input
                type="text"
                id="cep"
                {...register("cep")}
                placeholder="00000-000"
                onChange={(e) => handleCEPMask(e.target.value, setValue, trigger, setError, clearErrors)}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cep
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
            </div>

            <div className="flex gap-1">
              <div className="px-2 grow">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Endereço*</label>
                <input
                  type="text"
                  id="logradouro"
                  {...register("logradouro")}
                  className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.logradouro
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                    }`}
                />
                {errors.logradouro && <span className="text-red-500 text-xs">{errors.logradouro.message}</span>}
                <br />
                {errors.numero && <span className="text-red-500 text-xs">{errors.numero.message}</span>}
              </div>
              <div className="px-2">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">N°*</label>
                <input
                  type="text"
                  id="numero"
                  {...register("numero")}
                  className={`w-[66px] flex-none px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.numero
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                    }`}
                />
              </div>
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Complemento</label>
              <input
                type="text"
                id="complemento"
                {...register("complemento")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.complemento
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.complemento && <span className="text-red-500 text-xs">{errors.complemento.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Bairro*</label>
              <input
                type="text"
                id="bairro"
                {...register("bairro")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.bairro
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.bairro && <span className="text-red-500 text-xs">{errors.bairro.message}</span>}
            </div>

            <div className="flex gap-1">
              <div className="px-2 grow">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Municipio</label>
                <input
                  type="text"
                  id="municipio"
                  {...register("municipio")}
                  className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.municipio
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                    }`}
                />
                {errors.municipio && <span className="text-red-500 text-xs">{errors.municipio.message}</span>}
                {errors.uf && <span className="text-red-500 text-xs">{errors.uf.message}</span>}
              </div>

              <div className="px-2">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">UF</label>
                <input
                  type="text"
                  id="uf"
                  {...register("uf")}
                  className={`w-[66px] flex-none px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.uf
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                    }`}
                />
              </div>
            </div>
          </section>
          <section className="grid md:grid-cols-1 gap-2 2xl:gap-8 py-2 bg-white ">
            <div className="flex flex-col mx-auto w-full px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Informações Complementares</label>
              <textarea
                id="informacoes_complementares"
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
                {submitting ? `'ENVIANDO...'` : "SALVAR ALTERAÇÕES"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
