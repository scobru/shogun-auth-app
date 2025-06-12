// This is a fallback loader for Gun.js if CDN fails
// It will attempt to load from multiple sources

(function() {
  // Check if Gun is already loaded
  if (typeof window.Gun !== 'undefined') {
    console.log('Gun.js already loaded')
    return
  }

  console.log('Loading Gun.js from local fallback...')

  // Create script element for Gun.js
  const script = document.createElement('script')
  script.src = '/node_modules/gun/dist/gun.js'
  script.onload = function() {
    console.log('✅ Gun.js loaded from node_modules')
    
    // Load wire.js after gun.js
    const wireScript = document.createElement('script')
    wireScript.src = '/node_modules/gun/dist/lib/wire.js'
    wireScript.onload = function() {
      console.log('✅ Gun Wire loaded from node_modules')
    }
    wireScript.onerror = function() {
      console.warn('⚠️ Could not load Gun Wire from node_modules')
    }
    document.head.appendChild(wireScript)
  }
  script.onerror = function() {
    console.error('❌ Could not load Gun.js from any source')
  }
  
  document.head.appendChild(script)
})() 