"use client";

import Image from "next/image";
import logo from "../../assets/logo-header.png";
import { useAuth } from "../../Context/AuthContext";
import { CodeForm } from "./steps/FormCode";
import { LoginForm } from "./steps/FormLogin";
import { PasswordForm } from "./steps/FormPassword";
import { ReqAccessForm } from "./steps/FormReqAccess";
import { ResetPasswordForm } from "./steps/FormResetPassword";

export function ContainerForms() {
  const { step } = useAuth();

  return (
    <div>
      <Image src={logo} alt="Logo" priority />
      <br />
      {step === "username" && (
        <>
          <ReqAccessForm />
        </>
      )}

      {step === "signIn" && (
        <>
          <LoginForm />
        </>
      )}

      {step === "code" && (
        <>
          <CodeForm />
        </>
      )}

      {step === "password" && (
        <>
          <PasswordForm />
        </>
      )}
      {step === "resetPassword" && (
        <>
          <ResetPasswordForm />
        </>
      )}
    </div>
  );
}
