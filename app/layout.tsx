import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SystemDataProvider } from '@/context/system-data-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Navbar } from '@/components/navabr'
import './globals.css'
import '@xterm/xterm/css/xterm.css'


const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TSUKI-KAGE-SERVER',
  description: 'Server status and system information dashboard',
  generator: 'coldbydefault',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased bg-background" suppressHydrationWarning>
        <ThemeProvider>
          <SystemDataProvider>
            <TooltipProvider>
              <Navbar />
              {children}
            </TooltipProvider>
          </SystemDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}