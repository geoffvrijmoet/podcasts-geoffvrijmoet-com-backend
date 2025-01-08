/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pay.podcasts.geoffvrijmoet.com',
          },
        ],
        destination: '/pay/:path*',
      },
    ];
  },
};

export default nextConfig;
