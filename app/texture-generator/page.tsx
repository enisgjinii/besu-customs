import { Metadata } from 'next';
import { TextureGenerator } from '@/components/tools/texture-generator';

export const metadata: Metadata = {
    title: 'AI Texture Generator | Besu Customs',
    description: 'Generate seamless PBR textures with AI. Create normal, displacement, roughness, and AO maps instantly.',
};

export default function TextureGeneratorPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">AI Texture Generator</h1>
                <p className="text-muted-foreground">
                    Create professional seamless textures and PBR maps using AI.
                </p>
            </div>

            <TextureGenerator />
        </div>
    );
}
