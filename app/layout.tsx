import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Muhammad Hassan — Full-Stack AI Engineer', description: 'Full-stack AI engineer in Lahore. Building thoughtful digital products with Next.js, Node.js, and AI.', metadataBase: new URL('https://muhammad-hassan-portfolio.ready-fig-6019.chatgpt.site') };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
