/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { fetchAddressFromCep, handleCEPMask, handleCnpjCpfMask, handlePhoneMask } from "@/app/services/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { DadosEntregaFormData, DadosEntregaSchema } from "./schema";
import { useRouter } from "next/navigation";
import { UsuarioResponse } from "@/app/types/responseTypes";
import { Resumo } from "@/app/components/Resumo";
import { saveDeliveryCookie } from "@/app/utils/saveDeliveryCookie";
import Cookies from "js-cookie";

export function FormDadosEntrega() {
  const router = useRouter();
  const [clientData, setClientData] = useState<UsuarioResponse>({
    success: false,
    message: "",
    result: [],
  });
  const dataPedido = useMemo(() => {
    // Função auxiliar para adicionar dias úteis
    function adicionarDiasUteis(data: Date, diasUteis: number): Date {
      const novaData = new Date(data);
      let diasAdicionados = 0;

      while (diasAdicionados < diasUteis) {
        novaData.setDate(novaData.getDate() + 1);
        const diaSemana = novaData.getDay(); // 0 = domingo, 6 = sábado

        if (diaSemana !== 0 && diaSemana !== 6) {
          diasAdicionados++;
        }
      }

      return novaData;
    }

    // Data atual + 7 dias úteis
    const dataEntrega = adicionarDiasUteis(new Date(), 7);

    // Formata no padrão brasileiro
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
    }).format(dataEntrega);
  }, []);
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
  } = useForm<DadosEntregaFormData>({
    resolver: yupResolver(DadosEntregaSchema),
    mode: "onChange",
  });
  const cep = watch("cep");
  const uf = watch("uf");
  const municipio = watch("municipio");

  const delivery = useMemo(() => {
    const zipDigits = (cep || "").replace(/\D/g, "");
    return {
      stateCode: (uf || "").toUpperCase(),
      city: municipio || "",
      zipCode: zipDigits,
    };
  }, [cep, uf, municipio]);

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
      const endereco = addresses[0] as any;

      handleCEPMask(endereco?.zipcode ?? "", setValue, trigger, setError, clearErrors);
      setValue("logradouro", endereco?.street ?? "");
      setValue("numero", endereco?.number ?? "");
      setValue("complemento", endereco?.complement ?? "");
      setValue("bairro", endereco?.neighborhood ?? "");
      setValue("municipio", endereco?.city ?? "");
      const ufSigla = (endereco?.uf || endereco?.state || endereco?.stateCode || "").toString().trim().toUpperCase();
      setValue("uf", ufSigla);
    }
  }, [clientData, setValue, trigger, setError, clearErrors]);

  useEffect(() => {
    if (cep?.length === 9) {
      fetchAddressFromCep(cep, setValue, trigger, setError, clearErrors);
    }
  }, [cep, setValue, trigger, setError, clearErrors]);

  // Prefill from 'cliente' cookie if fields are empty
  useEffect(() => {
    try {
      const raw = Cookies.get("cliente");
      if (!raw) return;
      const c = JSON.parse(raw);

      const cookieDDD = c?.areaCode || c?.ddd || c?.phone?.areaCode || c?.phones?.[0]?.areaCode || "";
      const cookiePhone = c?.telefone || c?.phone || c?.phone?.number || c?.phones?.[0]?.number || "";
      const cookieCEP = c?.zipCodeBilling || c?.addressZip || c?.zipcode || c?.cep || c?.address?.zipcode || c?.addresses?.[0]?.zipcode || "";
      const cookieUF = (c?.uf || c?.addressState || c?.stateCode || c?.address?.stateCode || c?.addresses?.[0]?.stateCode || c?.address?.uf || "").toString().toUpperCase();

      if (!watch("ddd") && cookieDDD) setValue("ddd", cookieDDD);
      if (!watch("telefone") && cookiePhone) handlePhoneMask(cookiePhone, setValue, trigger, setError, clearErrors);
      if (!watch("cep") && cookieCEP) handleCEPMask(cookieCEP, setValue, trigger, setError, clearErrors);
      if (!watch("uf") && cookieUF) setValue("uf", cookieUF);
    } catch { /* ignore */ }
  }, [setValue, trigger, setError, clearErrors, watch]);

  function onSubmit(form: any) {
    setSubmitting(true);
    saveDeliveryCookie({
      id: form.userId, // se tiver
      entityTypeBilling: form.cnpj_cpf,
      legalNameBilling: form.razao_social,
      cpfCnpfBilling: form.cnpj_cpf,
      ieBilling: form.inscricao_estadual || "",
      emailBilling: form.email,
      areaCodeBilling: form.ddd,
      phoneBilling: form.telefone,
      addressIbgeCodeBilling: form.ibge || "",
      zipCodeBilling: form.cep,
      streetNameBilling: form.logradouro,
      streetNumberBilling: form.numero,
      addressLine2Billing: "",
      addressNeighborhoodBilling: form.bairro,
      addressCityBilling: form.municipio,
      addressStateCodeBilling: form.uf
    })
    setSubmitting(false);
    router.push("/forma-de-pagamento")
  }

  return (
    <div className="h-fit w-full px-2 relative z-40">
      <header className="p-2">
        <div className="w-full max-w-[95%] md:max-w-[92%] h-fit mx-auto flex flex-col justify-start items-center gap-1 z-50 relative">
          <h1 className="text-sm 2xl:text-xl font-bold font- text-primary text-center">
            CONFIRMAÇÃO DE DADOS DE ENTREGA
          </h1>
          <h2 className="text-sm 2xl:text-lg font-bold font-plutoRegular text-zinc-600 text-center"></h2>
        </div>
      </header>
      <div className="flex w-full h-full flex-col lg:flex-row">
        <form method="POST" onSubmit={handleSubmit(onSubmit)} className="w-full">
          <section className="grid md:grid-cols-2 gap-2 md:gap-4 bg-white mb-2">
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
            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Previsão de Entrega</label>
              <input
                type="text"
                id="previsao_entrega"
                {...register("previsao_entrega")}
                defaultValue={dataPedido}
                readOnly
                className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none"
              />
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
            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Contato para Entrega</label>
              <input
                type="text"
                id="contato_entrega"
                {...register("contato_entrega")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contato_entrega
                  ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                  : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
              />
              {errors.contato_entrega && <span className="text-red-500 text-xs">{errors.contato_entrega.message}</span>}
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
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">
                Razão Social / Nome completo
              </label>
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

            <div className="flex flex-col mx-auto w-full">
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
                <br />
                {errors.telefone && <span className="text-red-500 text-xs">{errors.telefone.message}</span>}
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
                {submitting ? `'ENVIANDO...'` : "CONTINUAR"}
              </button>
            </div>
          </section>
        </form>
        <div className="w-full lg:w-80 lg:max-w-80 h-full border-t lg:border-t-0 lg:border-l border-gray-300 p-4">
          <Resumo delivery={delivery} />
        </div>

      </div>

    </div>
  );
}
