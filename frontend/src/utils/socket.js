// socket.js - Utility functions for managing WebSocket connections in the Stay Fit frontend application. 
// Provides the base URL for the WebSocket server and a function to generate connection options, 
// including authentication and transport settings. This allows for flexible configuration of 
// real-time features in the app, such as live updates or notifications.


//import
import { API_BASE } from '../api';


// The base URL for the WebSocket server, 
// which can be configured via environment variables
export const SOCKET_BASE = process.env.REACT_APP_SOCKET_URL || API_BASE.replace('/api', '');


// Function to generate options for the WebSocket connection,
export function getSocketOptions(token) {
  const baseOptions = {
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  };


  // Determine the transport method based on environment variable settings.
  const transport = process.env.REACT_APP_SOCKET_TRANSPORT;

  // If transport is explicitly set to 'polling',
  //  use long-polling and disable WebSocket upgrade
  if (transport === 'polling') {
    return { ...baseOptions, transports: ['polling'], upgrade: false };
  }

  // Default to using WebSocket transport, but allow 
  // fallback to polling if needed
  if (transport === 'websocket') {
    return { ...baseOptions, transports: ['websocket'] };
  }

  // If no specific transport is set, allow both 
  // polling and WebSocket for maximum compatibility
  return { ...baseOptions, transports: ['polling', 'websocket'] };
}
