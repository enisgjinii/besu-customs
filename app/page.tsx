"use client";

import dynamic from "next/dynamic";

const DesignerPage = dynamic(
  () => import("@/components/designer/designer-page").then((module) => module.DesignerPage),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-dvh bg-background" data-designer-loading="v2" />
    ),
  },
);

export default function Home() {
  return <DesignerPage />;
}
