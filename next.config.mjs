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
        permanent: true,
        destination: '/pay',
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
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
      ],
    };
  },
};

export default nextConfig;
