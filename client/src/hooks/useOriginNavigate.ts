import { useNavigate, useLocation } from 'react-router-dom';

const useOriginNavigate = () => {
  const _navigate = useNavigate();
  const location = useLocation();

  const navigate = (url?: string | null, opts = {}) => {
    if (!url) {
      return;
    }
    const path = location.pathname.match(/^\/[^/]+\//);
    let prefix = '/c/';
    if (path) {
      prefix = path[0] === '/profile/' ? '/c/' : path[0];
    }
    _navigate(`${prefix}${url}`, opts);
  };

  return navigate;
};

export default useOriginNavigate;
