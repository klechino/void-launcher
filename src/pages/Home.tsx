import React from 'react';
import '../styles/Home.css';

interface HomeProps {
  profile: any;
}

const Home: React.FC<HomeProps> = ({ profile }) => {
  const handleLaunch = async () => {
    alert('Launching Minecraft...');
    try {
      await (window as any).electron.game.launch('default');
    } catch (error) {
      alert(`Launch error: ${error}`);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Welcome to Void Launcher</h1>
        <p>Your premium Minecraft client launcher</p>
      </div>

      {profile && (
        <div className="profile-card">
          <div className="profile-avatar">👤</div>
          <div className="profile-info">
            <h2>{profile.name}</h2>
            <p>Logged in with Microsoft Account</p>
          </div>
          <button className="launch-btn" onClick={handleLaunch}>
            ▶️ Launch Game
          </button>
        </div>
      )}

      <div className="quick-actions">
        <div className="action-card">
          <div className="icon">📦</div>
          <h3>Instances</h3>
          <p>Create and manage game instances</p>
        </div>
        <div className="action-card">
          <div className="icon">⚙️</div>
          <h3>Mods</h3>
          <p>Browse and install mods</p>
        </div>
        <div className="action-card">
          <div className="icon">🎨</div>
          <h3>Resource Packs</h3>
          <p>Customize your textures</p>
        </div>
        <div className="action-card">
          <div className="icon">⚡</div>
          <h3>Settings</h3>
          <p>Configure your launcher</p>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Instances</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Mods Installed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Resource Packs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">v1.0.0</div>
          <div className="stat-label">Launcher Version</div>
        </div>
      </div>
    </div>
  );
};

export default Home;