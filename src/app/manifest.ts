import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spicy Nuts",
    short_name: 'SpicyNuts',
    description: 'Pure, Natural, Organic foods directly from our farms to your table.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F6F2', // Match --bg-primary in light mode
    theme_color: '#2F7348', // Match --accent-green
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
