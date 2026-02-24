import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head>
        <meta name="description" content="Collaborative cooking blog" />
        <meta property="og:title" content="Get Stuffed!" />
        <meta property="og:description" content="Collaborative cooking blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://get-stuffed.vercel.app/" />
        <meta property="og:image" content="/preview.gif" />
        <meta property="og:image:type" content="image/gif" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}