'use client';
import './globals.css';
import { ReactNode, useEffect } from 'react';

export const metadata = {
  title: '??? ?? ????? | Night Work Inspiration',
  description: 'Cinematic 2D animation with Hindi narration and orchestral music.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = 'hi';
  }, []);

  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
