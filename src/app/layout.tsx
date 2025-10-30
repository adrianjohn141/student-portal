import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'BSCS-A Portal',
  description: 'BSCS A Student Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <div className="min-h-screen flex flex-col items-center">
          {children}
        </div>
      </body>
    </html>
  )
}