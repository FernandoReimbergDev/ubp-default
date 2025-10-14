"use client";

import { fetchAddressFromCep, handleCEPMask, handleCnpjCpfMask, handlePhoneMask } from "@/app/services/utils";
import { useEffect, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { SubmitHandler, useForm } from "react-hook-form";
import { groupUserOptions, MeusDadosFormData, MeusDadosSchema } from "./schema";

export function FormAdicionarUsuario() {
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
    defaultValues: {
      group_user: "",
    },
  });

  const cep = watch("cep");

  useEffect(() => {
    if (cep?.length === 9) {
      fetchAddressFromCep(cep, setValue, trigger, setError, clearErrors);
    }
  }, [cep, setValue, trigger, setError, clearErrors]);

  const onSubmit: SubmitHandler<MeusDadosFormData> = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/cadastro-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erro desconhecido" }));
        console.error("Falha ao cadastrar usuário:", err);
        alert(err?.message || "Erro ao enviar o formulário.");
        return;
      }

      const result = await res.json();
      console.log("Cadastro realizado:", result);
      alert("Usuário cadastrado com sucesso!");
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
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Login</label>
              <input
                type="text"
                id="login"
                {...register("login")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.login
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.login && <span className="text-red-500 text-xs">{errors.login.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Grupo usuário:</label>
              <select
                id="group_user"
                {...register("group_user")}
                className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="">Selecione...</option>

                {groupUserOptions.map((option, index) => (
                  <option key={`${option}-${index}`} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {errors.group_user && <span className="text-red-500 text-xs">{errors.group_user.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Nome completo</label>
              <input
                type="text"
                id="nome_completo"
                {...register("fullName")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName
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
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email
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
              {errors.telefone && <span className="text-red-500 text-xs">{errors.telefone.message}</span>}
              <br />
            </div>

            <div>
              <div className="px-2 w-full grow">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700 ">Celular</label>
                <input
                  type="text"
                  id="celular"
                  {...register("celular")}
                  placeholder="00000-0000"
                  className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telefone
                      ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                      : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
                />
              </div>
              {errors.celular && <span className="text-red-500 text-xs">{errors.celular.message}</span>}
              <br />
            </div>

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
          </section>

          <section className="grid md:grid-cols-2 gap-2 md:gap-4 bg-white mb-2 items-start">
            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CNPJ</label>
              <input
                type="text"
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
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Razão Social</label>
              <input
                type="text"
                id="razao_social"
                {...register("razao_social")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.razao_social
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.razao_social && <span className="text-red-500 text-xs">{errors.razao_social.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Franquia</label>
              <input
                type="text"
                id="franquia"
                {...register("franquia")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.franquia
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.franquia && <span className="text-red-500 text-xs">{errors.franquia.message}</span>}
            </div>

            <div className="px-2">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input
                type="text"
                id="inscricao_estadual"
                {...register("inscricao_estadual")}
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
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Inscrição Municipal</label>
              <input
                type="text"
                id="inscricao_municipal"
                {...register("inscricao_municipal")}
                className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.inscricao_municipal
                    ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                    : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                }`}
              />
              {errors.inscricao_municipal && (
                <span className="text-red-500 text-xs">{errors.inscricao_municipal.message}</span>
              )}
            </div>
          </section>

          <section className="grid md:grid-cols-1 gap-2 2xl:gap-8 py-2 bg-white ">
            <div className="w-full flex flex-col gap-4 items-center">
              <div className="w-full flex flex-col md:flex-row gap-4 items-center">
                <div className="px-2 w-full">
                  <label className="block text-xs 2xl:text-sm font-medium text-gray-700">CEP*</label>
                  <input
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
                <div className="flex gap-1 w-full">
                  <div className="px-2 w-full grow">
                    <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Endereço*</label>
                    <input
                      type="text"
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
                      id="numero"
                      {...register("numero")}
                      className={`w-[66px] flex-none px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.numero
                          ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                          : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                      }`}
                    />
                  </div>
                  <input type="hidden" id="ibge" {...register("ibge")} />
                </div>
              </div>
            </div>

            <div className="px-2 w-full">
              <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Complemento</label>
              <input
                type="text"
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

            <div className="w-full flex flex-col md:flex-row gap-4 items-center">
              <div className="px-2 w-full">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Bairro*</label>
                <input
                  type="text"
                  id="bairro"
                  {...register("bairro")}
                  className={`w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bairro
                      ? "border-red-500 focus:ring-red-500 focus:outline-none focus:ring-2"
                      : "border-gray-300 focus:ring-blue-500 focus:outline-none focus:ring-2"
                  }`}
                />
                {errors.bairro && <span className="text-red-500 text-xs">{errors.bairro.message}</span>}
              </div>

              <div className="flex gap-1 w-full">
                <div className="px-2 grow">
                  <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Municipio</label>
                  <input
                    type="text"
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
            </div>

            <div className="px-2">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-md cursor-pointer  ${
                  submitting ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-400"
                } text-white text-xs 2xl:text-sm`}
              >
                {submitting ? `'ENVIANDO...'` : "CADASTRAR USUARIO"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
