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
        hostname: "unitycorp.com.br",
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
        hostname: "n-unity-100",
      },
    ],
    qualities: [75, 100], // 👈 adicione aqui as qualidades permitidas

  },
  // Aqui libera IPs e origens específicas em dev
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.20.36",
    "https://amil.unitycorp.com.br",
    "http://n-unity-100:3000",
  ],
};

export default nextConfig;
