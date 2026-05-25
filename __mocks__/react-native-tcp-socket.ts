const mockSocket = {
  write: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

type MockServer = {
  listen: jest.Mock;
  close: jest.Mock;
  on: jest.Mock;
};

const mockServer: MockServer = {
  listen: jest.fn((_opts: unknown, cb?: () => void) => { cb?.(); return mockServer; }),
  close: jest.fn((cb?: () => void) => { cb?.(); }),
  on: jest.fn(),
};

const TcpSocket = {
  createServer: jest.fn((_opts?: unknown, handler?: (socket: unknown) => void) => {
    if (typeof _opts === 'function') _opts(mockSocket);
    else handler?.(mockSocket);
    return mockServer;
  }),
  createConnection: jest.fn((_opts: unknown, cb?: () => void) => {
    cb?.();
    return mockSocket;
  }),
};

export default TcpSocket;
