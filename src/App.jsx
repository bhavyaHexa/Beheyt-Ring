import { useState } from "react"
import ModelViewer from "./components/ModelViewer"
import Dropzone from "./components/Dropzone"

export default function App() {
  const [modelURL, setModelURL] = useState("/Beheyt Artisanaal_174_V1.4.glb")
  const [modelName, setModelName] = useState("Beheyt Artisanaal_174_V1.4.glb")
  const envURL = "/08.hdr"

  const handleFileLoaded = (url, name) => {
    setModelURL(url)
    setModelName(name)
  }

  return (
    <div className="app-container">
      <div className="ui-overlay">
        <h1>Beheyt Ring Viewer</h1>
        <p>{modelName}</p>
      </div>

      <ModelViewer modelUrl={modelURL} envUrl={envURL} />

      <Dropzone onFileLoaded={handleFileLoaded} />
    </div>
  )
}
