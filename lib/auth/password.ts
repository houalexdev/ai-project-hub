// 密码加密工具（使用 Node.js 内置 crypto，无需额外依赖）
import { createHash, randomBytes, timingSafeEqual } from 'crypto'

// PBKDF2 密码哈希（比 bcrypt 更适合 Edge 环境，纯 Node crypto）
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(salt + password + (process.env.AUTH_SECRET ?? 'default-secret-change-in-prod'))
    .digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = createHash('sha256')
    .update(salt + password + (process.env.AUTH_SECRET ?? 'default-secret-change-in-prod'))
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return '密码至少 8 位'
  if (!/[A-Za-z]/.test(password)) return '密码必须包含字母'
  if (!/[0-9]/.test(password)) return '密码必须包含数字'
  return null
}
