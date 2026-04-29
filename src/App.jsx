import ModelViewer from "./components/ModelViewer"

export default function App() {

  // 👉 PUT ANY GLB URL HERE
  const modelURL = "/Beheyt Artisanaal_174_V1.4.glb"

  const envURL = "/env_metal_001_d01c4504e0.hdr"

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ModelViewer modelUrl={modelURL} envUrl={envURL} />
    </div>
  )
}
