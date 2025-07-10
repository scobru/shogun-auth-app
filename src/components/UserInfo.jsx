import React, { useState, useMemo } from 'react';
import { gunAvatar } from 'gun-avatar';

/**
 * Component to display user information
 * @param {Object} props - Component props
 * @param {Object} props.user - User data
 * @param {Function} props.onLogout - Logout function
 */
const UserInfo = ({ user, onLogout }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!user) {
    return null;
  }

  const { email, name, picture, oauth, userPub } = user;
  const displayName = name || email || 'User';
  
  // Create a generated avatar if no picture is available
  const avatarContent = useMemo(() => {
    // If we have a picture from OAuth or directly, use it
    if (picture || oauth?.picture) {
      return <img src={picture || oauth?.picture} alt={displayName} />;
    }
    
    // Use gun-avatar if userPub is available
    if (userPub) {
      try {
        const avatarSrc = gunAvatar({ pub: userPub, size: 64 });
        return <img src={avatarSrc} alt={displayName} />;
      } catch (e) {
        console.error("Error generating gun-avatar:", e);
        // Fallback to initials if gun-avatar fails
      }
    }
    
    // Otherwise generate an avatar with initials
    const generateInitials = (name) => {
      if (!name) return '?';
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
    const initials = generateInitials(displayName);
    
    return (
      <div 
        style={{ 
          backgroundColor: '#4F6BF6', // A default color
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: '#ffffff',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}
      >
        {initials}
      </div>
    );
  }, [picture, oauth?.picture, userPub, displayName]);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              {avatarContent}
            </div>
          </div>
          <div>
            <h2 className="card-title">{displayName}</h2>
            <p className="text-sm opacity-70">{email}</p>
          </div>
        </div>

        <div className="divider"></div>

        <div className="flex justify-between items-center">
          <button 
            className="btn btn-sm btn-ghost"
            onClick={toggleDetails}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button 
            className="btn btn-sm btn-error"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-semibold">User ID:</span>
              <span className="truncate">{user.userPub || 'N/A'}</span>
            </div>
            
            {oauth && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold">OAuth Provider:</span>
                  <span>{oauth.provider || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold">OAuth ID:</span>
                  <span className="truncate">{oauth.id || 'N/A'}</span>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <span className="font-semibold">Username:</span>
              <span>{user.username}</span>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo; 