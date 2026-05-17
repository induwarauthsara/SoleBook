export function sanitizeForAI(data: unknown): unknown {
  if (typeof data === 'string') {
    let sanitized = data.replace(/\b\d{10,18}\b/g, '[ACCOUNT]');
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    sanitized = sanitized.replace(/\+?\d{10,12}/g, '[PHONE]');
    sanitized = sanitized.replace(/\b\d{9}[VX]\b/gi, '[NIC]');
    sanitized = sanitized.replace(/\b\d{12}\b/g, '[NIC]');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForAI(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sensitiveKeys = ['account_number', 'account_mask', 'nic', 'phone', 'address', 'email', 'password', 'secret', 'token'];
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitizeForAI(value);
      }
    }
    return result;
  }

  return data;
}
