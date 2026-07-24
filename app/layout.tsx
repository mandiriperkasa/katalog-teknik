import { Analytics } from '@vercel/analytics/next';

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('mp-site-theme');

    var theme =
      saved === 'light' || saved === 'dark'
        ? saved
        : 'light';

    document.documentElement.dataset.siteTheme =
      theme;
  } catch (_) {
    document.documentElement.dataset.siteTheme =
      'light';
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body>
        {children}
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  );
}
