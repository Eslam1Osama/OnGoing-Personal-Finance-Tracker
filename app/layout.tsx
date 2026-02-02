import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OnGoing - Personal Finance Tracker',
  description: 'Track your finances, bills, expenses, and more with OnGoing - Your comprehensive financial management solution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
