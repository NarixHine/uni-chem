import type { Metadata } from 'next'
import { Geist, Geist_Mono, Newsreader, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const heiti = Noto_Sans_SC({
    variable: '--font-noto-sans',
    subsets: ['latin'],
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
    title: 'Uni-Chem — Notes on Molecular Chemistry',
    description:
        'A blog about molecular structures, reaction mechanisms, and the chemistry that shapes everyday materials.',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang='en'
            className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${heiti.variable} h-full antialiased`}
        >
            <body className='bg-background text-foreground min-h-full flex flex-col'>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
