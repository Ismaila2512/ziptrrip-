import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const RouterContext = createContext();

export const BrowserRouter = ({ children }) => {
  const [location, setLocation] = useState(window.location);

  useEffect(() => {
    const handlePopState = () => {
      setLocation(new URL(window.location.href));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to, options = {}) => {
    if (options.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    const navEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navEvent);
  };

  const value = useMemo(() => ({ location, navigate }), [location]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useLocation must be used within a BrowserRouter');
  }
  return context.location;
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useNavigate must be used within a BrowserRouter');
  }
  return context.navigate;
};

export const Routes = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname;

  let match = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === Route) {
      const path = child.props.path;
      if (path === pathname || (path === '*' && !match)) {
        if (!match) {
          match = child;
        }
      } else if (path === '/' && pathname === '') {
          if (!match) match = child;
      }
    }
  });

  return match ? match.props.element : null;
};

export const Route = ({ path, element }) => {
  // The actual rendering is handled by Routes
  return null;
};

export const Link = ({ to, children, className, style, onClick }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
};
