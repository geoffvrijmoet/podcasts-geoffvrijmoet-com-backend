/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'pay.podcasts.geoffvrijmoet.com',
          },
        ],
        destination: '/pay',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
