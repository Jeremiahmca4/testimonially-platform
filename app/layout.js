import './globals.css';

export const metadata = {
  title: 'Revora.io — Turn Reviews Into Revenue',
  description: 'Monitor Google, Yelp, and Facebook reviews in one place — then turn your best ones into marketing assets.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
