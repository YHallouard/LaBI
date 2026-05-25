const Zeroconf = jest.fn().mockImplementation(() => ({
  publishService: jest.fn(),
  unpublishService: jest.fn(),
  scan: jest.fn(),
  stop: jest.fn(),
  removeDeviceListeners: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

export default Zeroconf;
