import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';

const SheetManager = observer(() => {
    const { designManager, sheetManager } = rootStore;
    const [isCollapsed, setIsCollapsed] = useState(false);

    const activeMaps = designManager.activeNormalMaps;
    const hasActiveMaps = activeMaps.length > 0;

    const handleSaveToSheet = () => {
        if (!hasActiveMaps) return;

        activeMaps.forEach(map => {
            sheetManager.addRecord(
                designManager.selectedCollection,
                designManager.selectedModelId,
                map.meshName,
                map.filename,
                designManager.normalIntensity
            );
        });

        // Flash feedback
        const btn = document.getElementById('save-sheet-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Saved to Sheet!';
            btn.classList.add('bg-green-600', 'text-white');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-green-600', 'text-white');
            }, 1500);
        }
    };

    return (
        <div className={`fixed top-8 right-8 z-30 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col pointer-events-auto ${
            isCollapsed ? 'w-auto h-auto' : 'w-[420px] max-h-[calc(100vh-6rem)]'
        }`}>
            {isCollapsed ? (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-4 bg-white/90 hover:bg-white text-black border border-black/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer font-semibold transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                >
                    <span className="text-xl">📊</span>
                    <span className="text-[0.85rem] pr-1">
                        View Sheet ({sheetManager.records.length})
                    </span>
                </button>
            ) : (
                <div className="flex flex-col bg-white/80 backdrop-blur-[20px] rounded-[1.5rem] border border-black/10 text-black shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden max-h-full">
                    {/* Header */}
                    <header className="p-5 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <div>
                                <h2 className="m-0 text-lg font-bold bg-[linear-gradient(135deg,#000_0%,#444_100%)] bg-clip-text text-transparent">
                                    Normals Spreadsheet
                                </h2>
                                <p className="text-[0.7rem] text-black/50 m-0 leading-tight">
                                    Manage & export model normal intensities
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="w-8 h-8 rounded-full border border-black/10 bg-transparent hover:bg-black/5 flex items-center justify-center cursor-pointer transition-colors text-black/60 font-semibold"
                            title="Collapse panel"
                        >
                            ✕
                        </button>
                    </header>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-5">
                        {/* Current Configuration Controller */}
                        <div className="bg-black/5 p-4 rounded-[1rem] border border-black/5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-black/40">Active Model</span>
                                    <h4 className="m-0 text-[1rem] font-bold text-black capitalize">
                                        {designManager.selectedCollection} collection
                                    </h4>
                                    <p className="m-0 text-[0.8rem] text-black/60 font-medium">
                                        Model #{designManager.selectedModelId} ({designManager.selectedVariation})
                                    </p>
                                </div>
                                <span className={`text-[0.7rem] px-2 py-1 rounded-full font-bold uppercase ${
                                    hasActiveMaps ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                    {hasActiveMaps ? 'Normal Map Active' : 'No Normal Map'}
                                </span>
                            </div>

                            {hasActiveMaps ? (
                                <div className="mt-2 flex flex-col gap-3">
                                    {/* Normal Map Details */}
                                    <div className="text-[0.75rem] bg-white/50 p-3 rounded-lg border border-black/5 flex flex-col gap-1">
                                        {activeMaps.map(map => (
                                            <div key={map.filename} className="flex justify-between">
                                                <span className="text-black/50 font-semibold">Mesh: <code className="text-black bg-black/5 px-1 py-0.5 rounded text-[0.7rem]">{map.meshName}</code></span>
                                                <span className="text-black/70 truncate max-w-[180px] font-semibold" title={map.filename}>
                                                    📂 {map.filename}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Slider Controls */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[0.8rem] font-bold">
                                            <span className="text-black/60">Adjust Normal Value:</span>
                                            <span className="text-black">{designManager.normalIntensity.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-5.0"
                                            max="5.0"
                                            step="0.05"
                                            value={designManager.normalIntensity}
                                            onChange={(e) => designManager.setNormalIntensity(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                                        />
                                        <div className="flex justify-between text-[0.65rem] text-black/40 font-bold px-0.5">
                                            <span>-5.0 (Inverted)</span>
                                            <span>0.0 (Flat)</span>
                                            <span>5.0 (Strong)</span>
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        id="save-sheet-btn"
                                        onClick={handleSaveToSheet}
                                        className="w-full mt-1 p-3 bg-black hover:bg-black/85 text-white font-bold text-[0.85rem] rounded-[0.75rem] border-none cursor-pointer transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                    >
                                        💾 Save Current to Sheet
                                    </button>
                                </div>
                            ) : (
                                <p className="text-[0.8rem] text-black/50 m-0 italic bg-white/30 p-3 rounded-lg border border-dashed border-black/10 text-center">
                                    No normal maps are configured for the active ring model variation.
                                </p>
                            )}
                        </div>

                        {/* Spreadsheet Grid */}
                        <div className="flex flex-col flex-1 min-h-[220px]">
                            <h3 className="text-[0.75rem] uppercase tracking-[0.08em] text-black/50 mb-2 font-bold">
                                Sheet Rows ({sheetManager.records.length})
                            </h3>
                            
                            <div className="flex-1 border border-black/10 rounded-[1rem] overflow-hidden bg-white/40 flex flex-col">
                                {/* Table Wrapper */}
                                <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[280px] custom-scrollbar">
                                    <table className="w-full border-collapse text-left text-[0.75rem]">
                                        <thead>
                                            <tr className="bg-black/5 border-b border-black/10 sticky top-0 z-10">
                                                <th className="p-2 font-bold text-black/70 border-r border-black/5">Col</th>
                                                <th className="p-2 font-bold text-black/70 border-r border-black/5">Model</th>
                                                <th className="p-2 font-bold text-black/70 border-r border-black/5">Mesh</th>
                                                <th className="p-2 font-bold text-black/70 border-r border-black/5">Normal Map</th>
                                                <th className="p-2 font-bold text-black/70 border-r border-black/5">Val</th>
                                                <th className="p-2 text-center text-black/40"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sheetManager.records.length > 0 ? (
                                                sheetManager.records.map((row) => (
                                                    <tr key={row.id} className="border-b border-black/5 hover:bg-black/[0.02] group transition-colors">
                                                        <td className="p-2 font-medium capitalize text-black/80 border-r border-black/5">{row.collectionName}</td>
                                                        <td className="p-2 font-bold text-black border-r border-black/5">#{row.modelNumber}</td>
                                                        <td className="p-2 text-black/70 border-r border-black/5"><code className="bg-black/5 px-1 py-0.5 rounded text-[0.65rem]">{row.meshName}</code></td>
                                                        <td className="p-2 text-black/60 truncate max-w-[100px] border-r border-black/5" title={row.normalMapName}>{row.normalMapName}</td>
                                                        <td className="p-2 font-extrabold text-black text-right border-r border-black/5">{row.normalValue.toFixed(2)}</td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => sheetManager.deleteRecord(row.id)}
                                                                className="w-5 h-5 rounded-full bg-transparent hover:bg-red-50 hover:text-red-600 text-black/30 border-none cursor-pointer flex items-center justify-center transition-colors text-[0.8rem]"
                                                                title="Delete row"
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-black/40 italic">
                                                        Sheet is empty. Apply a normal map & click save.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {sheetManager.records.length > 0 && (
                        <div className="p-4 border-t border-black/5 bg-black/[0.01] flex gap-3">
                            <button
                                onClick={() => sheetManager.exportToCSV()}
                                className="flex-1 py-3 bg-[linear-gradient(135deg,#1f8b4c_0%,#156f3a_100%)] hover:opacity-95 text-white font-bold text-[0.85rem] rounded-[0.75rem] border-none cursor-pointer transition-all shadow-[0_4px_10px_rgba(21,111,58,0.2)] flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                📥 Export to Sheets / CSV
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to clear the sheet?')) {
                                        sheetManager.clearRecords();
                                    }
                                }}
                                className="py-3 px-4 bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-[0.8rem] rounded-[0.75rem] border border-red-200 hover:border-red-300 cursor-pointer transition-colors"
                            >
                                Clear Sheet
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default SheetManager;
