import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Post an event requirement | GoPratle',
  description: 'Find the right people to make your event memorable.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
