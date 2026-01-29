import { API_BASE } from '../api';

export const SOCKET_BASE = process.env.REACT_APP_SOCKET_URL || API_BASE.replace('/api', '');

export function getSocketOptions(token) {
  const baseOptions = {
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  };

  const transport = process.env.REACT_APP_SOCKET_TRANSPORT;
  if (transport === 'polling') {
    return { ...baseOptions, transports: ['polling'], upgrade: false };
  }
  if (transport === 'websocket') {
    return { ...baseOptions, transports: ['websocket'] };
  }

  return { ...baseOptions, transports: ['polling', 'websocket'] };
}
