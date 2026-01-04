declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import { Loader, LoadingManager, Group } from 'three';
    import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

    export interface GLTF {
        animations: any[];
        scene: Group;
        scenes: Group[];
        cameras: any[];
        asset: any;
    }

    export class GLTFLoader extends Loader {
        constructor(manager?: LoadingManager);
        load(
            url: string,
            onLoad: (gltf: GLTF) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
        parse(
            data: ArrayBuffer | string,
            path: string,
            onLoad: (gltf: GLTF) => void,
            onError?: (event: ErrorEvent) => void
        ): void;
    }
}
