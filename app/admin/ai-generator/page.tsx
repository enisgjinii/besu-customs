'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { AIImageGenerator } from '@/components/admin/ai-image-generator';

export default function AIGeneratorPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">AI Image Generator</h1>
        <p className="text-muted-foreground mb-8">
          Generate custom images using AI and apply them to your 3D models
        </p>
        <AIImageGenerator />
      </div>
    </AdminLayout>
  );
}
