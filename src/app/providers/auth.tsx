"use client";
import { SessionProvider, SessionProviderProps } from "next-auth/react";

export const NextauthProvider = ({ children }: SessionProviderProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};
