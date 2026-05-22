import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**', // Izinkan semua path gambar dari Google
      },
      {
        protocol: 'http', // atau 'https' tergantung AWS-mu
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api.verideon.site', // Ganti dengan domain backend AWS-mu nanti
        port: '', // Kosongkan kalau pakai HTTPS standar
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
