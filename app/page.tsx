"use client";

import dynamic from "next/dynamic";

const DesignerPage = dynamic(
  () => import("@/components/designer/designer-page").then((module) => module.DesignerPage),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-dvh items-center justify-center bg-[#f7f7f5]"
        data-designer-loading="v3"
      >
        <div className="h-8 w-8 animate-pulse rounded-full bg-foreground/10" />
      </div>
    ),
  },
);

export default function Home() {
  return <DesignerPage />;
}
