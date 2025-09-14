import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['localhost'], // allow localhost images
  }


};

export default nextConfig;
