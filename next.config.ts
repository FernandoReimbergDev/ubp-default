/** @type {import('next').NextConfig} */

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Faltando variáveis de ambiente essenciais");
}

const nextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "unitybrindes.com.br",
      },
      {
        protocol: "https",
        hostname: "www2.unitycorp.com.br",
      },
      {
        protocol: "https",
        hostname: "unitycorp.com.br",
      },
      {
        protocol: "https",
        hostname: "cx.unitycorp.com.br",
      },
      {
        protocol: "https",
        hostname: "amil.unitycorp.com.br",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "unity-n-14",
      },
    ],
    qualities: [75, 100], // 👈 adicione aqui as qualidades permitidas

  },

};

export default nextConfig;
