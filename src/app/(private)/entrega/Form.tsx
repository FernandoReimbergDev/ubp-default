/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { handleCEPMask, handleCnpjCpfMask, handlePhoneMask } from "@/app/services/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { DadosEntregaFormData, DadosEntregaSchema } from "./schema";
import { useRouter } from "next/navigation";
import { UsuarioResponse } from "@/app/types/responseTypes";
import { Resumo } from "@/app/components/Resumo";
import Cookies from "js-cookie";
import { useCart } from "@/app/Context/CartContext";

export function FormDadosEntrega() {
  const { fetchSendAddress } = useCart();

  const [adressShipping, setAdressShipping] = useState({
    cep: "04583-110",
    logradouro: "Av. Doutor Chucri Zaidan",
    numero: "246",
    complemento: "12ºandar",
    bairro: "Vila Cordeiro",
    municipio: "São Paulo",
    uf: "SP",
    razao_social: "Caixa Vida e Previdencia S/A",
    cnpj: "03.730.204/0001-76",
  });
  const enderecos = useMemo(
    () => [
      {
        LABEL: "Escritório Riverview (Morumbi)",
        RAZÃO_SOCIAL: "Caixa Vida e Previdencia S/A",
        CNPJ: "03.730.204/0001-76",
        CEP: "04583-110",
        LOGRADOURO: "Av. Doutor Chucri Zaidan",
        NUMERO: "246",
        COMPLEMENTO: "12ºandar",
        BAIRRO: "Vila Cordeiro",
        MUNICIPIO: "São Paulo",
        UF: "SP",
      },
      {
        LABEL: "Escritório CEA (Alphaville)",
        RAZÃO_SOCIAL: "Caixa Vida e Previdencia S/A",
        CNPJ: "03.730.204/0004-19",
        CEP: "06455-000",
        LOGRADOURO: "Alameda Araguaia",
        NUMERO: "2104",
        COMPLEMENTO: "Condomínio CEA - Andar 23",
        BAIRRO: "Sitio Tamboré",
        MUNICIPIO: "Barueri",
        UF: "SP",
      },
      {
        LABEL: "Transportadora Profile (Armazém)",
        RAZÃO_SOCIAL: "Profile Solucoes em Logistica LTDA",
        CNPJ: "05.935.141/0001-10",
        CEP: "06268-110",
        LOGRADOURO: "Av. Lourenço Beloli",
        NUMERO: "1415",
        COMPLEMENTO: "",
        BAIRRO: "Vila Menck",
        MUNICIPIO: "Osasco",
        UF: "SP",
      },
    ],
    []
  );
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
    const dataEntrega = adicionarDiasUteis(new Date(), 15);

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
    if (!clientData) return;

    const { result } = clientData;
    if (!Array.isArray(result) || result.length === 0) return;

    const { email, cnpj, phones, addresses, ie } = result[0];

    if (Array.isArray(phones) && phones.length > 0) {
      phones.map((tel) => {
        if (tel?.number) {
          handlePhoneMask(tel.number, setValue, trigger, setError, clearErrors);
        }
        return null;
      });
    }
    if (email) setValue("email", email);
    if (cnpj) handleCnpjCpfMask(cnpj, setValue, trigger, setError, clearErrors);
    if (Array.isArray(addresses) && addresses.length > 0) {
      handleCEPMask(adressShipping.cep, setValue, trigger, setError, clearErrors);
      setValue("cep", adressShipping.cep);
      setValue("logradouro", adressShipping.logradouro);
      setValue("numero", adressShipping.numero);
      setValue("complemento", adressShipping.complemento);
      setValue("bairro", adressShipping.bairro);
      setValue("municipio", adressShipping.municipio);
      setValue("uf", adressShipping.uf);
      setValue("razao_social", adressShipping.razao_social);
      setValue("cnpj_cpf", adressShipping.cnpj);
      setValue("inscricao_estadual", ie ?? "");
      setValue("ddd", phones[0].areaCode ?? "11");
      setValue("contato_entrega", clientData.result[0].fullName);
    }
  }, [
    clientData,
    setValue,
    trigger,
    setError,
    clearErrors,
    adressShipping.complemento,
    adressShipping.cep,
    adressShipping.logradouro,
    adressShipping.numero,
    adressShipping.bairro,
    adressShipping.municipio,
    adressShipping.uf,
    adressShipping.razao_social,
    adressShipping.cnpj,
  ]);

  const handleAddressChange = useCallback(
    (endereco: (typeof enderecos)[number]) => {
      setAdressShipping({
        cep: endereco.CEP,
        logradouro: endereco.LOGRADOURO,
        numero: endereco.NUMERO,
        complemento: endereco.COMPLEMENTO,
        bairro: endereco.BAIRRO,
        municipio: endereco.MUNICIPIO,
        uf: endereco.UF,
        razao_social: endereco.RAZÃO_SOCIAL,
        cnpj: endereco.CNPJ,
      });

      // Atualiza os campos do form
      setValue("cep", endereco.CEP);
      setValue("logradouro", endereco.LOGRADOURO);
      setValue("numero", endereco.NUMERO);
      setValue("complemento", endereco.COMPLEMENTO);
      setValue("bairro", endereco.BAIRRO);
      setValue("municipio", endereco.MUNICIPIO);
      setValue("uf", endereco.UF);
      setValue("razao_social", endereco.RAZÃO_SOCIAL);
      setValue("cnpj_cpf", endereco.CNPJ);
    },
    [setValue] // setAdressShipping é estável, não precisa entrar
  );

  useEffect(() => {
    fetchUserData();
    handleAddressChange(enderecos[0]);
  }, [fetchUserData, handleAddressChange, enderecos]);

  useEffect(() => {
    try {
      const raw = Cookies.get("cliente");
      if (!raw) return;
      const c = JSON.parse(raw);

      const cookieDDD = c?.areaCode || c?.ddd || c?.phone?.areaCode || c?.phones?.[0]?.areaCode || "";
      const cookiePhone = c?.telefone || c?.phone || c?.phone?.number || c?.phones?.[0]?.number || "";
      const cookieCEP =
        c?.zipCodeBilling ||
        c?.addressZip ||
        c?.zipcode ||
        c?.cep ||
        c?.address?.zipcode ||
        c?.addresses?.[0]?.zipcode ||
        "";
      const cookieUF = (
        c?.uf ||
        c?.addressState ||
        c?.stateCode ||
        c?.address?.stateCode ||
        c?.addresses?.[0]?.stateCode ||
        c?.address?.uf ||
        ""
      )
        .toString()
        .toUpperCase();

      if (!watch("ddd") && cookieDDD) setValue("ddd", cookieDDD);
      if (!watch("telefone") && cookiePhone) handlePhoneMask(cookiePhone, setValue, trigger, setError, clearErrors);
      if (!watch("cep") && cookieCEP) handleCEPMask(cookieCEP, setValue, trigger, setError, clearErrors);
      if (!watch("uf") && cookieUF) setValue("uf", cookieUF);
    } catch {
      /* ignore */
    }
  }, [setValue, trigger, setError, clearErrors, watch]);

  function onSubmit(form: any) {
    setSubmitting(true);
    try {
      const cpfCnpjShipping = form.cnpj_cpf.replace(/\D/g, "");
      fetchSendAddress(
        Number(clientData?.result[0].id),
        "PJ",
        form.contato_entrega,
        form.razao_social,
        cpfCnpjShipping,
        form.inscricao_estadual || "",
        form.email,
        form.ddd,
        form.telefone.replace(/\D/g, ""),
        form.ibge || "",
        form.cep.replace(/\D/g, ""),
        form.logradouro,
        form.numero,
        form.complemento,
        form.bairro,
        form.municipio,
        form.uf
      );
    } catch (error) {
      console.error("Erro ao enviar dados de entrega:", error);
    }
    setSubmitting(false);
    router.push("/forma-de-pagamento");
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
          <h2 className="px-2 text-sm 2xl:text-lg font-bold font-plutoRegular text-zinc-600">
            Selecione o local de entrega:
          </h2>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:flex-row 2xl:items-center gap-4 mt-2 mb-6">
            {enderecos.map((endereco, index) => {
              const isSelected = adressShipping.cep === endereco.CEP;
              return (
                <div className="flex items-center gap-2 px-2" key={index + 1}>
                  <input
                    type="radio"
                    name="filial"
                    id={`filial_${index + 1}`}
                    checked={isSelected}
                    onChange={() => handleAddressChange(endereco)}
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor={`filial_${index + 1}`}
                    className={`text-gray-800 cursor-pointer ${isSelected ? "font-bold text-primary" : ""}`}
                  >
                    {endereco.LABEL}
                  </label>
                </div>
              );
            })}
          </section>
          <section className="grid md:grid-cols-2 gap-2 md:gap-4 bg-white">
            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CEP*</label>
              <input
                readOnly
                type="text"
                id="cep"
                {...register("cep")}
                placeholder="00000-000"
                onChange={(e) => handleCEPMask(e.target.value, setValue, trigger, setError, clearErrors)}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cep
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
            </div>
            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Previsão de Entrega </label>
              <input
                type="text"
                id="previsao_entrega"
                {...register("previsao_entrega")}
                defaultValue={dataPedido}
                readOnly
                className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none"
              />
              <span className="text-xs text-gray-500 italic">* Após aprovação do pedido e aprovação do layout</span>
            </div>
            <div className="flex gap-1">
              <div className="px-2 grow">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Endereço*</label>
                <input
                  type="text"
                  readOnly
                  id="logradouro"
                  {...register("logradouro")}
                  className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.logradouro
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
                  readOnly
                  id="numero"
                  {...register("numero")}
                  className={`w-[66px] flex-none px-1 py-1  md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.numero
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
                readOnly
                id="complemento"
                {...register("complemento")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.complemento
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
                readOnly
                {...register("bairro")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bairro
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
                  readOnly
                  id="municipio"
                  {...register("municipio")}
                  className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.municipio
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
                  readOnly
                  id="uf"
                  {...register("uf")}
                  className={`w-[66px] flex-none px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.uf
                      ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                      : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
                />
              </div>
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">
                Razão Social / Nome completo
              </label>
              <input
                type="text"
                id="razao_social"
                {...register("razao_social")}
                readOnly
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.razao_social
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.razao_social && <span className="text-red-500 text-xs">{errors.razao_social.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CNPJ / CPF</label>
              <input
                type="text"
                readOnly
                id="cnpj_cpf"
                {...register("cnpj_cpf")}
                placeholder="00.000.000/0001-00"
                onChange={(e) => handleCnpjCpfMask(e.target.value, setValue, trigger, setError, clearErrors)}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 rounded-md border transition-all duration-150
                                        ${
                                          errors.cnpj_cpf
                                            ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                                            : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                                        }`}
                maxLength={18}
              />
              {errors.cnpj_cpf && <span className="text-red-500 text-xs">{errors.cnpj_cpf.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input
                type="text"
                id="inscricao_estadual"
                {...register("inscricao_estadual")}
                readOnly
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.inscricao_estadual
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.inscricao_estadual && (
                <span className="text-red-500 text-xs">{errors.inscricao_estadual.message}</span>
              )}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">
                Nome do contato para entrega
              </label>
              <input
                type="text"
                id="contato_entrega"
                {...register("contato_entrega")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contato_entrega
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.contato_entrega && <span className="text-red-500 text-xs">{errors.contato_entrega.message}</span>}
            </div>

            <div className="flex flex-col mx-auto w-full">
              <div>
                <div className="w-full flex gap-4 justify-between items-center">
                  <div className="w-[78px] px-2">
                    <label className="block text-xs 2xl:text-sm font-medium text-gray-700">DDD</label>
                    <input
                      type="text"
                      id="ddd"
                      maxLength={2}
                      {...register("ddd")}
                      className={`w-[66px] flex-none px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.ddd
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
                      className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.telefone
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

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>
          </section>
          <section className="grid md:grid-cols-1 gap-2 2xl:gap-4 bg-white ">
            <div className="p-2">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-md cursor-pointer  ${
                  submitting ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-400"
                } text-white text-xs 2xl:text-sm`}
              >
                {submitting ? `'ENVIANDO...'` : "CONTINUAR"}
              </button>
            </div>
          </section>
        </form>
        <div className="w-full lg:w-full lg:max-w-80 h-full border-t lg:border-t-0 lg:border-l border-gray-300 px-2 mt-4">
          <Resumo delivery={delivery} />
        </div>
      </div>
    </div>
  );
}
