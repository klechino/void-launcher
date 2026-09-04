import React, { useEffect, useState } from 'react';
import '../styles/Mods.css';

interface ModsProps {
  selectedInstance?: string;
}

const Mods: React.FC<ModsProps> = ({ selectedInstance }) => {
  const [mods, setMods] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [installedMods, setInstalledMods] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMods();
    loadInstalledMods();
  }, [selectedInstance]);

  const loadMods = async () => {
    setLoading(true);
    try {
      const result = await (window as any).electron.mods.search({
        query: searchQuery,
        filter: filter,
      });
      setMods(result);
    } catch (error) {
      console.error('Failed to load mods:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledMods = async () => {
    try {
      if (selectedInstance) {
        const result = await (window as any).electron.mods.getInstalled(selectedInstance);
        setInstalledMods(new Set(result.map((m: any) => m.id)));
      }
    } catch (error) {
      console.error('Failed to load installed mods:', error);
    }
  };

  const handleInstall = async (modId: string) => {
    try {
      const result = await (window as any).electron.mods.install(modId, selectedInstance);
      if (result.success) {
        setInstalledMods(new Set([...installedMods, modId]));
        alert('Mod installed successfully!');
      } else {
        alert(`Installation failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Install error: ${error}`);
    }
  };

  const handleUninstall = async (modId: string) => {
    try {
      const result = await (window as any).electron.mods.uninstall(modId, selectedInstance);
      if (result.success) {
        installedMods.delete(modId);
        setInstalledMods(new Set(installedMods));
        alert('Mod uninstalled successfully!');
      } else {
        alert(`Uninstall failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Uninstall error: ${error}`);
    }
  };

  return (
    <div className="mods-container">
      <h1>Mods</h1>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search mods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={loadMods} disabled={loading}>
            {loading ? '🔄 Searching...' : '🔍 Search'}
          </button>
        </div>
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Mods</option>
            <option value="popular">Popular</option>
            <option value="trending">Trending</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>
      </div>

      <div className="mods-list">
        {mods.length === 0 ? (
          <div className="empty-state">
            <p>No mods found. Try searching for something!</p>
          </div>
        ) : (
          mods.map((mod) => (
            <div key={mod.id} className="mod-card">
              {mod.icon && <img src={mod.icon} alt={mod.name} className="mod-icon" />}
              <div className="mod-info">
                <h3>{mod.name}</h3>
                <p className="author">by {mod.author}</p>
                <p className="description">{mod.description}</p>
                <div className="mod-meta">
                  <span>⭐ {mod.rating}</span>
                  <span>📥 {mod.downloads}</span>
                  <span>🏷️ {mod.category}</span>
                </div>
              </div>
              <div className="mod-actions">
                {installedMods.has(mod.id) ? (
                  <button
                    className="uninstall-btn"
                    onClick={() => handleUninstall(mod.id)}
                  >
                    ✓ Installed
                  </button>
                ) : (
                  <button className="install-btn" onClick={() => handleInstall(mod.id)}>
                    + Install
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Mods;