import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  createSessionToken,
  verifySessionToken,
} from '@/lib/auth/session';
import { AuthUser } from '@/types';

describe('Authentication and Session Security', () => {
  it('should hash and compare passwords reliably', async () => {
    const password = 'demoPassword123';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('wrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should create and verify JWT session tokens accurately', async () => {
    const mockUser: AuthUser = {
      id: 'test-user-id-123',
      name: 'Prof. Tester',
      username: 'tester',
      email: 'tester@college.edu',
      role: 'FACULTY',
    };

    const token = await createSessionToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const session = await verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.user.id).toBe(mockUser.id);
    expect(session?.user.name).toBe(mockUser.name);
    expect(session?.user.role).toBe('FACULTY');
  });

  it('should reject invalid or tampered session tokens', async () => {
    const invalidToken = 'invalid.jwt.token';
    const session = await verifySessionToken(invalidToken);
    expect(session).toBeNull();
  });
});
