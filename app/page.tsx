"use client";

import dynamic from "next/dynamic";

const DesignerPage = dynamic(
  () => import("@/components/designer/designer-page").then(module => module.DesignerPage),
  { ssr: false, loading: () => <div style={{ minHeight: "100dvh", background: "#fff" }} /> },
);

export default function Home() {
  return <DesignerPage />;
}
