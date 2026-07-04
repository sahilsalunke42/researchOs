import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';
import { httpErrors } from '../errors/httpErrors.js';
import type { UserDTO } from '../types/api.types.js';

interface RegisterInput { email: string; password: string; name: string; }
interface LoginInput { email: string; password: string; }

function toDTO(u: { id: string; email: string; name: string; createdAt: Date }): UserDTO {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt.toISOString() };
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: CONSTANTS.JWT_TTL_SECONDS });
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: UserDTO; token: string }> {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw httpErrors.conflict('Email already registered', 'EMAIL_TAKEN');
    const passwordHash = await bcrypt.hash(input.password, CONSTANTS.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, name: input.name.trim(), passwordHash }
    });
    return { user: toDTO(user), token: signToken(user.id) };
  },

  async login(input: LoginInput): Promise<{ user: UserDTO; token: string }> {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw httpErrors.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw httpErrors.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    return { user: toDTO(user), token: signToken(user.id) };
  },

  async getMe(userId: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw httpErrors.unauthorized('Session expired', 'SESSION_EXPIRED');
    return toDTO(user);
  }
};
