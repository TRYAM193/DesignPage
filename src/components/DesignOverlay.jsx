import React, { useState } from 'react'
import { TransformControls } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

export default function DesignOverlay({ textureSrc }) {
    if (!textureSrc) return null;
    const overlayTexture = useLoader(TextureLoader, textureSrc);
    // Store position, scale, rotation in state for reset/undo
    const [position, setPosition] = useState([0, 0.8, 1.12]); // Slightly above shirt
    const [scale, setScale] = useState([0.8, 0.5, 1]);
    const [rotation, setRotation] = useState([0, 0, 0]);

    return (
        <TransformControls
            mode="translate"
            position={position}
            scale={scale}
            rotation={rotation}
            onChange={e => {
                if (
                    !e.object ||
                    !e.object.position ||
                    !e.object.scale ||
                    !e.object.rotation
                ) return;
                setPosition(e.object.position.toArray());
                setScale(e.object.scale.toArray());
                setRotation([
                    e.object.rotation.x,
                    e.object.rotation.y,
                    e.object.rotation.z
                ]);
            }}>
            <mesh position={position} scale={scale} rotation={rotation}>
                <planeGeometry args={[1.1, 0.8]} />
                <meshStandardMaterial map={overlayTexture} transparent />
            </mesh>
        </TransformControls>
    );
};
