'use client';

import { useEffect } from 'react';

const GOOGLE_ADS_PURCHASE_CONVERSION_ID = 'AW-18130712066/zMwHCIG2ycEcEILsssVD';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function getTransactionId(params: URLSearchParams) {
  return (
    params.get('payment_id') ||
    params.get('collection_id') ||
    params.get('merchant_order_id') ||
    params.get('preference_id') ||
    ''
  );
}

export function GoogleAdsPurchaseConversion() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    const transactionId = getTransactionId(params);
    const conversionKey = `google-ads-purchase-conversion:${GOOGLE_ADS_PURCHASE_CONVERSION_ID}:${transactionId || window.location.search}`;

    if (window.sessionStorage.getItem(conversionKey)) return;

    const reportConversion = () => {
      if (typeof window.gtag !== 'function') return false;

      window.gtag('event', 'conversion', {
        send_to: GOOGLE_ADS_PURCHASE_CONVERSION_ID,
        transaction_id: transactionId
      });
      window.sessionStorage.setItem(conversionKey, 'true');
      return true;
    };

    if (reportConversion()) return;

    const retry = window.setInterval(() => {
      if (reportConversion()) window.clearInterval(retry);
    }, 300);

    const timeout = window.setTimeout(() => window.clearInterval(retry), 6000);

    return () => {
      window.clearInterval(retry);
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
