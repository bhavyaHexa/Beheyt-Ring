import * as THREE from 'three'
import { Environment, useTexture } from '@react-three/drei'

interface EnvConverterProps {
  imageUrl: string;
  showBackground?: boolean;
  environmentIntensity?: number;
  envRotation?: [number, number, number];
}

export default function EnvConverter({ imageUrl, showBackground = false, environmentIntensity = 1, envRotation = [0, 0, 0] }: EnvConverterProps) {
  // useTexture handles the loading and suspends the component until ready
  const texture = useTexture(imageUrl)
  
  // Set equirectangular mapping for the texture to be used as an environment
  if (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
  }
  
  return (
    <Environment 
      map={texture} 
      background={showBackground} 
      environmentIntensity={environmentIntensity}
      environmentRotation={envRotation}
      backgroundRotation={envRotation}
    />
  )
}
