// This is a fallback loader for Gun.js if CDN fails
// It will attempt to load from multiple sources

(function() {
  // Check if Gun is already loaded
  if (typeof window.Gun !== 'undefined') {
    console.log('Gun.js already loaded')
    return
  }

  console.log('Loading Gun.js from CDN...')

  // Create script element for Gun.js
  const script = document.createElement('script')
  script.src = 'https://cdn.skypack.dev/gun@0.2020.1240'
  script.onload = function() {
    console.log('✅ Gun.js loaded from CDN')
    
    // Gun.js loaded successfully, check if we need additional modules
    if (typeof window.Gun !== 'undefined') {
      console.log('✅ Gun.js is ready')
    }
  }
  script.onerror = function() {
    console.error('❌ Could not load Gun.js from CDN, trying backup...')
    
    // Try backup CDN
    const backupScript = document.createElement('script')
    backupScript.src = 'https://unpkg.com/gun@0.2020.1240/dist/gun.js'
    backupScript.onload = function() {
      console.log('✅ Gun.js loaded from backup CDN')
    }
    backupScript.onerror = function() {
      console.error('❌ Could not load Gun.js from any source')
    }
    document.head.appendChild(backupScript)
  }
  
  document.head.appendChild(script)
})() 