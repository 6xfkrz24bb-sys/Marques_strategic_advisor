import Script from 'next/script';

const DEFAULT_GOOGLE_TAG_ID = 'GTM-K895MNRB';

function normalizeGoogleTagId(value?: string) {
  const tagId = (value || DEFAULT_GOOGLE_TAG_ID).trim();
  if (!tagId) return null;
  return /^[A-Za-z0-9_-]+$/.test(tagId) ? tagId : null;
}

export function GoogleTag() {
  const tagId = normalizeGoogleTagId(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID);
  if (!tagId) return null;

  if (tagId.startsWith('GTM-')) {
    return (
      <>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${tagId}');
          `}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${tagId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      </>
    );
  }

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
