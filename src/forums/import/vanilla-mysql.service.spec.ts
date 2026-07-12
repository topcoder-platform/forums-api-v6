import * as mysql from 'mysql2/promise';

import { VanillaMysqlService } from './vanilla-mysql.service';

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(),
}));

describe('VanillaMysqlService', () => {
  const createPool = jest.mocked(mysql.createPool);

  beforeEach(() => {
    createPool.mockReset();
  });

  it('creates and reuses a Vanilla MySQL pool from configuration', async () => {
    const query = jest.fn().mockResolvedValue([[{ ok: 1 }]]);
    const end = jest.fn().mockResolvedValue(undefined);
    const configService = {
      get: jest
        .fn()
        .mockReturnValue('mysql://user:pass@example.com:3306/vanilla'),
    };

    createPool.mockReturnValue({ query, end } as any);

    const service = new VanillaMysqlService(configService as any);

    await expect(service.ping()).resolves.toBeUndefined();
    await expect(service.query('SELECT ? AS value', [1])).resolves.toEqual([
      { ok: 1 },
    ]);

    expect(createPool).toHaveBeenCalledTimes(1);
    expect(createPool).toHaveBeenCalledWith({
      uri: 'mysql://user:pass@example.com:3306/vanilla',
      connectionLimit: 4,
      namedPlaceholders: false,
    });
    expect(query).toHaveBeenNthCalledWith(1, 'SELECT 1 AS ok', []);
    expect(query).toHaveBeenNthCalledWith(2, 'SELECT ? AS value', [1]);

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('fails before creating a pool when VANILLA_DB_URL is missing', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };
    const service = new VanillaMysqlService(configService as any);

    await expect(service.ping()).rejects.toThrow(
      'VANILLA_DB_URL must be configured for Vanilla import.',
    );
    expect(createPool).not.toHaveBeenCalled();
  });
});
