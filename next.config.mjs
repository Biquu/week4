/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js App Router için doğru konfigürasyon
  serverExternalPackages: [], // Güncellenmiş isim
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Büyük dosya yükleme için zaman aşımı süresini artır
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
