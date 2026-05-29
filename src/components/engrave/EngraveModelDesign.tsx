import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import { engraveManager } from '../../managers/engraveManager';
import '../../styles/Sidebar.css';

const EngraveModelDesign = observer(() => {
    const { designManager } = rootStore;

    return (
        <aside className="sidebar">
            <button 
                onClick={() => designManager.setCurrentView('home')}
                className="mb-6 text-[0.85rem] font-semibold flex items-center gap-2 text-white/60 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
            >
                ← Back to Design
            </button>

            <div className="sidebar-header">
                <h2>3D Viewer</h2>
            </div>

            <div className="sidebar-content">
                <section className="control-group">
                    <h3>Scene Controls</h3>
                    <div className="control-item">
                        <label>Engraving:</label>
                        <input 
                            type="text" 
                            className="p-2 bg-black/20 border border-white/10 rounded text-white"
                            value={engraveManager.engraving} 
                            onChange={(event) => engraveManager.setEngraving(event.target.value)} 
                        />
                    </div>
                    <div className="mb-4">
                        <label>Your Input</label><br />
                        <span className="text-white/70">{engraveManager.engraving}</span>
                    </div>
                </section>

                <section className="control-group">
                    <h3>Lighting</h3>
                    <div className="control-item">
                        <label htmlFor="ambient-intensity">Ambient Intensity:</label>
                        <input
                            type="range"
                            id="ambient-intensity"
                            min="0"
                            max="2"
                            step="0.1"
                            value={engraveManager.ambientIntensity}
                            onChange={(event) => engraveManager.setAmbientIntensity(Number(event.target.value))}
                        />
                    </div>
                </section>
            </div>
        </aside>
    );
});

export default EngraveModelDesign;
