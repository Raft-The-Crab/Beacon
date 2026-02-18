import { Home, Plus, Compass, Folder } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useServerStore } from '../../stores/useServerStore'
import { openCreateServerModal } from '../../utils/modals'
import styles from './ServerList.module.css'

export function ServerList() {
  const navigate = useNavigate()
  const servers = useServerStore(state => state.servers);
  const folders = useServerStore(state => state.folders);
  const currentServerId = useServerStore(state => state.currentServerId);
  const setCurrentServer = useServerStore(state => state.setCurrentServer);
  const toggleFolder = useServerStore(state => state.toggleFolder);

  // Group servers into folders or standalone
  const serversInFolders = new Set(folders.flatMap(f => f.serverIds));
  const standaloneServers = servers.filter(s => !serversInFolders.has(s.id));

  const handleServerClick = (server: any) => {
    setCurrentServer(server.id)
    if (server.channels && server.channels.length > 0) {
      navigate(`/channels/${server.id}/${server.channels[0].id}`)
    } else {
      navigate(`/server/${server.id}/settings`)
    }
  }

  return (
    <div className={styles.serverList}>
      <button
        className={`${styles.serverButton} ${styles.homeButton} ${currentServerId === null ? styles.activeServer : ''}`}
        title="Home"
        onClick={() => {
          setCurrentServer(null);
          navigate('/channels/@me');
        }}
      >
        <Home size={24} />
      </button>
      
      <div className={styles.divider} />

      {/* Folders */}
      {folders.map(folder => (
        <div key={folder.id} className={`${styles.folderContainer} ${folder.isCollapsed ? styles.collapsed : ''}`}>
          <button 
            className={styles.folderIcon} 
            onClick={() => toggleFolder(folder.id)}
            style={{ backgroundColor: folder.color }}
            title={folder.name}
          >
            {folder.isCollapsed ? <Folder size={24} fill="currentColor" /> : <div className={styles.folderOpenIndicator} />}
          </button>
          
          <div className={styles.folderServers}>
            {folder.serverIds.map(sid => {
              const server = servers.find(s => s.id === sid);
              if (!server) return null;
              return (
                <button
                  key={server.id}
                  className={`${styles.serverButton} ${currentServerId === server.id ? styles.activeServer : ''}`}
                  title={server.name}
                  onClick={() => handleServerClick(server)}
                >
                  <div className={styles.serverIcon}>
                    {server.icon ? (
                      <img src={server.icon} alt={server.name} className={styles.serverIconImg} />
                    ) : (
                      <span>{server.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Standalone Servers */}
      {standaloneServers.map((server) => (
        <button
          key={server.id}
          className={`${styles.serverButton} ${currentServerId === server.id ? styles.activeServer : ''}`}
          title={server.name}
          onClick={() => handleServerClick(server)}
        >
          <div className={styles.serverIcon}>
            {server.icon ? (
              <img src={server.icon} alt={server.name} className={styles.serverIconImg} />
            ) : (
              <span>{server.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </button>
      ))}
      
      <button
        className={`${styles.serverButton} ${styles.addButton}`}
        title="Create a server"
        onClick={() => openCreateServerModal()}
      >
        <Plus size={24} />
      </button>
      
      <div className={styles.divider} />
      
      <button className={styles.serverButton} title="Discover communities" onClick={() => navigate('/app')}>
        <Compass size={24} />
      </button>
    </div>
  )
}
