import Script from 'next/script';

function normalizeGoogleTagId(value?: string) {
  const tagId = value?.trim();
  if (!tagId) return null;
  return /^[A-Za-z0-9_-]+$/.test(tagId) ? tagId : null;
}

export function GoogleTag() {
  const tagId = normalizeGoogleTagId(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID);
  if (!tagId) return null;

  return (
    <>
      <Script
        id="google-tag-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}');
        `}
      </Script>
    </>
  );
}
