export type Database = {
  runAsync: (query: string, params?: any[]) => Promise<void>;
  getAllAsync: <T>(query: string, params?: any[]) => Promise<T[]>;
  getFirstAsync: <T>(query: string, params?: any[]) => Promise<T | null>;
};

// Mock database instance
const mockDb: Database = {
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([{
    id: 'test-id',
    date: '2023-06-15T10:00:00.000Z',
    pdf_source: 'file://test.pdf',
    lab_values: '{"some_lab_value":{"value":5.2,"unit":"mg/L"}}'
  }]),
  getFirstAsync: jest.fn().mockResolvedValue({
    id: 'test-id',
    date: '2023-06-15T10:00:00.000Z',
    pdf_source: 'file://test.pdf',
    lab_values: '{"some_lab_value":{"value":5.2,"unit":"mg/L"}}'
  })
};

// Mock initialization function
export const initializeDatabase = jest.fn().mockResolvedValue(undefined);

// Mock getDatabase function
export const getDatabase = jest.fn().mockReturnValue(mockDb); 