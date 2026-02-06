import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { DeveloperEasterEgg } from "@/components/ui/developer-easter-egg";
import { InstallPrompt } from "@/components/install-prompt";
import './globals.css';

export const metadata: Metadata = {
  title: 'Babynum Time',
  description: 'Aplikasi pencatatan aktivitas bayi dengan AI - minum, popok, dan analisis tangisan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Babynum Time',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@6..72,700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />

        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Puter.js for AI */}
        <script src="https://js.puter.com/v2/" defer></script>
        
        {/* Error handling for Puter.js */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.target && (e.target.src || '').includes('js.puter.com')) {
                  console.warn('Gagal memuat Puter.js. Fitur AI mungkin tidak tersedia.');
                  // Create a dummy puter object to prevent crashes
                  if (typeof window.puter === 'undefined') {
                    window.puter = {
                      ai: {
                        chat: async () => {
                          throw new Error('Puter AI gagal dimuat (Masalah Koneksi/SSL). Silakan refresh atau cek koneksi internet.');
                        }
                      }
                    };
                  }
                }
              }, true);
            `
          }}
        />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <InstallPrompt />
        <Toaster />
        <DeveloperEasterEgg />
      </body>
    </html>
  );
}
