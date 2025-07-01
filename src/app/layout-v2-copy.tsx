import { GeistSans } from '@vercel/geist/font/sans';
import { GeistMono } from '@vercel/geist/font/mono';
import './globals.css';

export const metadata = {
  title: 'Resume Comparison Platform',
  description: 'Compare your resume with job postings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <main className={GeistMono.className}>{children}</main>
      </body>
    </html>
  );
}