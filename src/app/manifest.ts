import type { MetadataRoute } from 'next';

// Home-screen app details. Bump ICON_VERSION when the icons change so phones fetch the new ones.
const ICON_VERSION = 2;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spicy Nuts",
    short_name: 'Spicy Nuts',
    description: 'Premium dry fruits, nuts, seeds and spices from Bidar, Karnataka.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf6ee', // --background
    theme_color: '#6e1a2c', // --primary (maroon header)
    icons: [
      {
        src: `/icons/icon-192x192.png?v=${ICON_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icons/icon-512x512.png?v=${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Extra space around the logo so Android's round or squircle mask never cuts it.
        src: `/icons/maskable-512x512.png?v=${ICON_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
