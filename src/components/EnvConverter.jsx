import * as THREE from 'three'
import { Environment, useTexture } from '@react-three/drei'

export default function EnvConverter({ imageUrl, showBackground = false, environmentIntensity = 1, envRotation = [0, 0, 0] }) {
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
      rotation={envRotation}
      backgroundRotation={envRotation}
    />
  )
}
