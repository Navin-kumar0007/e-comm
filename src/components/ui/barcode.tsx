"use client";

import dynamic from "next/dynamic";

const BarcodeComponent = dynamic(() => import("react-barcode"), { ssr: false });

export default function Barcode(props: any) {
  return <BarcodeComponent {...props} />;
}
