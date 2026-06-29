const originalFetch = window.fetch;

window.fetch = async function(...args) {
  let [url, options] = args;
  
  // Ensure options exists
  options = options || {};
  
  if (typeof url === 'string' && url.startsWith('/api')) {
    let userId = localStorage.getItem('taskflow_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('taskflow_user_id', userId);
    }
    
    options.headers = {
      ...options.headers,
      'x-user-id': userId
    };
  }
  
  return originalFetch.call(this, url, options);
};
