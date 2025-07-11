import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
const robotoMono = Roboto_Mono({ subsets: ['latin'], weight: ['400'] });

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
    <html lang="en" className={inter.className}>
      <body>
        <main className={robotoMono.className}>{children}</main>
      </body>
    </html>
  );
}