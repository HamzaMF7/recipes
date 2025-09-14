import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://your-graphql-host.example" crossOrigin="" />
        <link rel="dns-prefetch" href="https://your-graphql-host.example" /> 
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
