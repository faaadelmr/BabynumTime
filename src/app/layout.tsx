import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { DeveloperEasterEgg } from "@/components/ui/developer-easter-egg";
import './globals.css';

export const metadata: Metadata = {
  title: 'Babynum Time',
  description: 'Lacak jadwal menyusui bayi Anda dengan mudah.',
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
        <script src="https://js.puter.com/v2/" defer></script>
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <DeveloperEasterEgg />
      </body>
    </html>
  );
}
