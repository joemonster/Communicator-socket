/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Wyłącz SWC minify, jeśli występują problemy
  swcMinify: true,
}

module.exports = nextConfig
