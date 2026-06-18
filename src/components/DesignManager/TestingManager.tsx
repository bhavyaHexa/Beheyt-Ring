import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useDropzone } from "react-dropzone";
import { rootStore } from "../../managers/stateManager";
import { ColorType, FinishType } from "../../types";
import { Upload, Trash2, RotateCw, Scale, ArrowLeft, RotateCcw } from "lucide-react";

export const TestingManager = observer(() => {
  const { designManager } = rootStore;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Revoke old URL if exists to prevent memory leaks
        if (designManager.testingGlbUrl) {
          URL.revokeObjectURL(designManager.testingGlbUrl);
        }
        const url = URL.createObjectURL(file);
        designManager.setTestingGlb(url, file.name);
      }
    },
    [designManager]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "model/gltf-binary": [".glb"],
      "model/gltf+json": [".gltf"],
    },
    multiple: false,
  });

  const clearModel = () => {
    if (designManager.testingGlbUrl) {
      URL.revokeObjectURL(designManager.testingGlbUrl);
    }
    designManager.setTestingGlb(null, null);
  };

  const resetSettings = () => {
    designManager.setTestingScale(1.0);
    designManager.setTestingAutoScale(true);
    designManager.setAutoRotate(true);
    designManager.setAutoRotateSpeed(0.5);
    designManager.setColor("gold");
    designManager.setFinish("polished");
    designManager.setDiamond(true);
  };

  const colors: ColorType[] = ["gold", "silver", "rose gold"];
  const finishes: FinishType[] = ["polished", "matte"];

  return (
    <div className="p-8 bg-white/70 backdrop-blur-[20px] rounded-[1.5rem] border border-black/10 text-black w-[400px] max-h-[calc(100vh-4rem)] overflow-y-auto shadow-[0_10px_30px_rgba(0,0,0,0.1)] custom-scrollbar">
      <header className="mb-6">
        <h2 className="m-0 text-2xl font-bold bg-[linear-gradient(135deg,#000_0%,#444_100%)] bg-clip-text text-transparent">
          GLB Sandbox
        </h2>
        <p className="text-[0.9rem] text-black/60 mt-2">
          Drop any GLB model to test rendering under exact production settings.
        </p>
      </header>

      {/* File Dropzone */}
      <div className="mt-6">
        {!designManager.testingGlbUrl ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-[1.25rem] p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-black bg-black/5 scale-[1.02]"
                : "border-black/20 hover:border-black/40 hover:bg-black/5"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-3 text-black/40" size={32} />
            <p className="text-[0.9rem] font-semibold text-black/80 m-0">
              Drag & drop GLB file here
            </p>
            <p className="text-[0.75rem] text-black/40 mt-1 uppercase tracking-wider">
              or click to browse
            </p>
          </div>
        ) : (
          <div className="bg-black/5 border border-black/10 rounded-[1.25rem] p-5 flex items-center justify-between">
            <div className="overflow-hidden mr-4">
              <p className="text-[0.75rem] text-black/40 uppercase tracking-wider font-semibold m-0">
                Loaded Model
              </p>
              <p className="text-[0.95rem] font-bold text-black/80 truncate mt-1" title={designManager.testingGlbName || ""}>
                {designManager.testingGlbName}
              </p>
            </div>
            <button
              onClick={clearModel}
              className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-full cursor-pointer transition-colors duration-200 flex items-center justify-center"
              title="Clear model"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Material & Styling Customizer */}
      <div className="mt-8 pt-6 border-t border-black/10">
        <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">
          Material Presets
        </h3>

        {/* Color Picker */}
        <div className="mb-6">
          <span className="text-[0.8rem] text-black/60 font-semibold block mb-3">Color</span>
          <div className="flex gap-6">
            {colors.map((color) => (
              <div
                key={color}
                className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 group"
                onClick={() => designManager.setColor(color)}
                title={color.charAt(0).toUpperCase() + color.slice(1)}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 border-black/10 transition-all duration-300 group-hover:scale-110 group-hover:border-black/50 ${
                    color === "gold"
                      ? "bg-[linear-gradient(135deg,#bf953f,#fcf6ba,#b38728,#fcf6ba,#aa771c)]"
                      : color === "silver"
                        ? "bg-[linear-gradient(135deg,#707070,#e0e0e0,#808080,#ffffff,#909090)]"
                        : color === "rose gold"
                          ? "bg-[linear-gradient(135deg,#a85f44,#e8a274,#fddde6,#e8a274,#a85f44)]"
                          : "bg-gray-400"
                  } ${
                    designManager.selectedColor === color
                      ? "scale-115 border-black shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                      : ""
                  }`}
                ></div>
                <span
                  className={`text-[0.75rem] capitalize transition-all duration-300 ${
                    designManager.selectedColor === color
                      ? "text-black font-semibold"
                      : "text-black/50"
                  }`}
                >
                  {color}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Finish (Finition) */}
        <div className="mb-6">
          <span className="text-[0.8rem] text-black/60 font-semibold block mb-3">Finition</span>
          <div className="grid grid-cols-2 gap-3">
            {finishes.map((f) => (
              <button
                key={f}
                className={`p-3 bg-black/5 border border-black/10 rounded-[0.75rem] text-black cursor-pointer transition-all duration-200 text-[0.85rem] font-semibold hover:bg-black/10 hover:-translate-y-0.5 capitalize ${
                  designManager.selectedFinish === f
                    ? "bg-black/20 font-bold border-black/20 shadow-none"
                    : ""
                }`}
                onClick={() => designManager.setFinish(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Diamonds Toggle */}
        <div className="bg-black/5 p-4 rounded-[1rem] border border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[0.85rem] font-semibold text-black/80">Diamonds</span>
            </div>
            <div
              className={`relative w-14 h-8 rounded-full cursor-pointer transition-all duration-500 ease-in-out ${
                designManager.showDiamond ? "bg-black shadow-[0_0_15px_rgba(0,0,0,0.2)]" : "bg-black/10"
              }`}
              onClick={() => designManager.setDiamond(!designManager.showDiamond)}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-500 ease-in-out transform ${
                  designManager.showDiamond ? "translate-x-6" : "translate-x-0"
                } shadow-md flex items-center justify-center`}
              >
                <div
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    designManager.showDiamond ? "bg-black scale-100" : "bg-black/20 scale-50"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Controls */}
      <div className="mt-8 pt-6 border-t border-black/10">
        <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">
          Transform & Scale
        </h3>

        {/* Auto Scale Toggle */}
        <div className="flex items-center justify-between mb-5 bg-black/5 p-4 rounded-[1rem] border border-black/5">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-black/60" />
            <span className="text-[0.85rem] font-semibold text-black/80">Auto Scale to Fit</span>
          </div>
          <div
            className={`relative w-12 h-7 rounded-full cursor-pointer transition-all duration-300 ${
              designManager.testingAutoScale ? "bg-black" : "bg-black/10"
            }`}
            onClick={() => designManager.setTestingAutoScale(!designManager.testingAutoScale)}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${
                designManager.testingAutoScale ? "translate-x-5" : "translate-x-0"
              } shadow-md`}
            />
          </div>
        </div>

        {/* Manual Scale Slider */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.8rem] text-black/60 font-semibold">Manual Scale</span>
            <span className="text-[0.8rem] text-black/80 font-bold">{designManager.testingScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.05"
            value={designManager.testingScale}
            onChange={(e) => designManager.setTestingScale(parseFloat(e.target.value))}
            className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>
      </div>

      {/* Rotation Controls */}
      <div className="mt-6">
        <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">
          Rotation
        </h3>

        {/* Auto Rotate Toggle */}
        <div className="flex items-center justify-between mb-5 bg-black/5 p-4 rounded-[1rem] border border-black/5">
          <div className="flex items-center gap-2">
            <RotateCw size={16} className="text-black/60" />
            <span className="text-[0.85rem] font-semibold text-black/80">Auto Rotate</span>
          </div>
          <div
            className={`relative w-12 h-7 rounded-full cursor-pointer transition-all duration-300 ${
              designManager.autoRotate ? "bg-black" : "bg-black/10"
            }`}
            onClick={() => designManager.setAutoRotate(!designManager.autoRotate)}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${
                designManager.autoRotate ? "translate-x-5" : "translate-x-0"
              } shadow-md`}
            />
          </div>
        </div>

        {/* Auto Rotate Speed */}
        {designManager.autoRotate && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[0.8rem] text-black/60 font-semibold">Rotation Speed</span>
              <span className="text-[0.8rem] text-black/80 font-bold">{designManager.autoRotateSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={designManager.autoRotateSpeed}
              onChange={(e) => designManager.setAutoRotateSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={resetSettings}
          className="w-full p-4 bg-white text-black border border-black/10 hover:bg-black/5 rounded-[1rem] font-bold text-[0.9rem] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw size={16} />
          Reset Settings
        </button>

        <button
          onClick={() => designManager.navigateTo("/")}
          className="w-full p-4 bg-black text-white hover:bg-black/90 rounded-[1rem] font-bold text-[0.9rem] transition-all duration-200 shadow-md flex items-center justify-center gap-2 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Customizer
        </button>
      </div>
    </div>
  );
});

export default TestingManager;
