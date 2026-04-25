import { render, screen, waitFor } from '@testing-library/react';

const mockWindow = window;
const mockNavigate = jest.fn();

function mockPage() {
  return {
    __esModule: true,
    default: () => null,
  };
}

jest.mock('./api', () => ({
  __esModule: true,
  API_BASE: 'http://localhost:4000',
  default: {},
  getMe: jest.fn(),
  getPosts: jest.fn(),
  toggleLike: jest.fn(),
  toggleSave: jest.fn(),
}));

jest.mock('./components/Header', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/Navbar', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/DebugOverlay', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./pages/Home', () => ({
  __esModule: true,
  default: ({ isAuthenticated }) => (
    <div>
      {!isAuthenticated ? (
        <>
          <h1>Welcome to Stay Fit</h1>
          <p>Join fitness community</p>
        </>
      ) : (
        <h1>Home</h1>
      )}
    </div>
  ),
}));

jest.mock('./pages/Login', () => mockPage());
jest.mock('./pages/Register', () => mockPage());
jest.mock('./pages/SocialLogin', () => mockPage());
jest.mock('./pages/VerifyEmail', () => mockPage());
jest.mock('./pages/VerifyEmailToken', () => mockPage());
jest.mock('./pages/Profile', () => mockPage());
jest.mock('./pages/SavedPosts', () => mockPage());
jest.mock('./pages/Settings', () => mockPage());
jest.mock('./pages/UserDetails', () => mockPage());
jest.mock('./pages/OtherSettings', () => mockPage());
jest.mock('./pages/AboutSettings', () => mockPage());
jest.mock('./pages/StatsSettings', () => mockPage());
jest.mock('./pages/ShareApp', () => mockPage());
jest.mock('./pages/PublicShare', () => mockPage());
jest.mock('./pages/FindFriends', () => mockPage());
jest.mock('./pages/Post', () => mockPage());
jest.mock('./pages/PostComments', () => mockPage());
jest.mock('./pages/FriendRequests', () => mockPage());
jest.mock('./pages/UserProfile', () => mockPage());
jest.mock('./pages/UserFriends', () => mockPage());
jest.mock('./pages/Notifications', () => mockPage());
jest.mock('./pages/Friends', () => mockPage());
jest.mock('./pages/ChatPage', () => mockPage());
jest.mock('./pages/Calendar', () => mockPage());
jest.mock('./pages/Tutorials', () => mockPage());
jest.mock('./pages/OnboardingTutorial', () => mockPage());
jest.mock('./pages/AIHelper', () => mockPage());
jest.mock('./pages/Terms', () => mockPage());
jest.mock('./pages/Privacy', () => mockPage());

jest.mock('react-router-dom', () => {
  const React = require('react');

  const matchPath = (pattern, pathname) => {
    if (!pattern) return false;
    if (pattern === pathname) return true;
    if (pattern === '/') return pathname === '/';
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    if (patternParts.length !== pathParts.length) return false;
    return patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index]);
  };

  return {
    BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }) => {
      const pathname = mockWindow.location.pathname || '/';
      const route = React.Children.toArray(children).find((child) => matchPath(child?.props?.path, pathname));
      return route ? route.props.element : null;
    },
    Route: () => null,
    Navigate: ({ to }) => React.createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockWindow.location.pathname, search: mockWindow.location.search }),
  };
}, { virtual: true });

import App from './App';

const setRoute = (path) => {
  window.history.pushState({}, 'Test page', path);
};

describe('system smoke tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('shows the public home screen for anonymous visitors', async () => {
    setRoute('/');

    render(<App />);

    expect(await screen.findByText(/welcome to stay fit/i)).toBeInTheDocument();
    expect(screen.getByText(/join fitness community/i)).toBeInTheDocument();
  });

  test('blocks protected settings route when the user is not authenticated', async () => {
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/login required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/log in or create an account to access this page/i)).toBeInTheDocument();
  });
});
