import React from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';

const DesignManager = observer(() => {
    const { designManager } = rootStore;

    const collections = ['briljant'];
    const modelIds = ['546'];
    const variations = ['4.5mm', '5.0mm'];
    const colors = ['gold', 'silver', 'Rose Gold'];

    return (
        <div className="p-8 bg-white/70 backdrop-blur-[20px] rounded-[1.5rem] border border-black/10 text-black max-w-[400px] shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
            <header className="mb-8">
                <h2 className="m-0 text-2xl font-bold bg-[linear-gradient(135deg,#000_0%,#444_100%)] bg-clip-text text-transparent">
                    Design Configurator
                </h2>
                <p className="text-[0.9rem] text-black/60 mt-2">
                    Select your ring specifications
                </p>
            </header>

            <div className="mt-8">
                <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">Collection</h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
                    {collections.map(col => (
                        <button
                            key={col}
                            className={`p-3 bg-black/5 border border-black/10 rounded-[0.75rem] text-black cursor-pointer transition-all duration-200 text-[0.85rem] font-semibold hover:bg-black/10 hover:-translate-y-0.5 ${designManager.selectedCollection === col ? 'bg-black/20 font-bold border-black/20 shadow-[0_4px_15px_rgba(0,0,0,0.2)]' : ''
                                }`}
                            onClick={() => designManager.setCollection(col)}
                        >
                            {col.charAt(0).toUpperCase() + col.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">Model ID</h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
                    {modelIds.map(id => (
                        <button
                            key={id}
                            className={`p-3 bg-black/5 border border-black/10 rounded-[0.75rem] text-black cursor-pointer transition-all duration-200 text-[0.85rem] font-semibold hover:bg-black/10 hover:-translate-y-0.5 ${designManager.selectedModelId === id ? 'bg-black/20 font-bold border-black/20 shadow-none' : ''
                                }`}
                            onClick={() => designManager.setModelId(id)}
                        >
                            #{id}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">Variation</h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
                    {variations.map(v => (
                        <button
                            key={v}
                            className={`p-3 bg-black/5 border border-black/10 rounded-[0.75rem] text-black cursor-pointer transition-all duration-200 text-[0.85rem] font-semibold hover:bg-black/10 hover:-translate-y-0.5 ${designManager.selectedVariation === v ? 'bg-black/20 font-bold border-black/20 shadow-none' : ''
                                }`}
                            onClick={() => designManager.setVariation(v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 mb-4 font-semibold">Color</h3>
                <div className="flex gap-6">
                    {colors.map(color => (
                        <div
                            key={color}
                            className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 group"
                            onClick={() => designManager.setColor(color)}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                        >
                            <div className={`w-10 h-10 rounded-full border-2 border-black/10 transition-all duration-300 group-hover:scale-110 group-hover:border-black/50 ${color === 'gold' ? 'bg-[linear-gradient(135deg,#bf953f,#fcf6ba,#b38728,#fcf6ba,#aa771c)]' :
                                color === 'silver' ? 'bg-[linear-gradient(135deg,#707070,#e0e0e0,#808080,#ffffff,#909090)]' :
                                    color === 'Rose Gold' ? 'bg-[linear-gradient(135deg,#b76e79,#ffd1dc,#b76e79)]' : 'bg-gray-400'
                                } ${designManager.selectedColor === color ? 'scale-115 border-black shadow-[0_0_20px_rgba(0,0,0,0.2)]' : ''
                                }`}></div>
                            <span className={`text-[0.75rem] capitalize transition-all duration-300 ${designManager.selectedColor === color ? 'text-black font-semibold' : 'text-black/50'
                                }`}>
                                {color}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 bg-black/5 p-4 rounded-[1rem] border border-black/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[0.8rem] uppercase tracking-[0.1rem] text-black/50 font-semibold mb-1">Diamonds</h3>

                    </div>
                    <div
                        className={`relative w-14 h-8 rounded-full cursor-pointer transition-all duration-500 ease-in-out ${designManager.showDiamond ? 'bg-black shadow-[0_0_15px_rgba(0,0,0,0.2)]' : 'bg-black/10'}`}
                        onClick={() => designManager.setDiamond(!designManager.showDiamond)}
                    >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-500 ease-in-out transform ${designManager.showDiamond ? 'translate-x-6' : 'translate-x-0'} shadow-md flex items-center justify-center`}>
                            <div className={`w-1 h-1 rounded-full transition-all duration-500 ${designManager.showDiamond ? 'bg-black scale-100' : 'bg-black/20 scale-50'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default DesignManager;
