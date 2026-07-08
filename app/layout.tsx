import type { Metadata } from 'next'
import Script from 'next/script'
import { DM_Sans, Geist, Geist_Mono, Newsreader, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const dmSans = DM_Sans({
    variable: '--font-en-sans',
    subsets: ['latin'],
})

const heiti = Noto_Sans_SC({
    subsets: ['latin'],
    weight: ['500', '700'],
    variable: '--font-noto-sans',
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

const newsreader = Newsreader({
    variable: '--font-newsreader',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: '有机化学探微',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang='en'
            className={`${dmSans.variable} ${geistMono.variable} ${newsreader.variable} ${heiti.variable} h-full antialiased`}
        >
            <body className='bg-background text-foreground min-h-full flex flex-col'>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
