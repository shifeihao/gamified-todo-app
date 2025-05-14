import { jest } from '@jest/globals';

describe('Jest配置测试', () => {
  it('Jest全局对象应该可用', () => {
    const mockFn = jest.fn();
    mockFn();
    expect(mockFn).toHaveBeenCalled();
  });

  it('基本断言应该工作', () => {
    expect(1 + 1).toBe(2);
  });
}); 