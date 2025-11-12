// === GESTIÓN DE SEGURIDAD - UNINOTE ===

export class SecurityManager {
  static bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }

  static async hashPasswordWithSalt(password) {
    if (!password) return null;

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = 100000;
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );

    return {
      hash: this.bufferToHex(derivedBits),
      salt: this.bufferToHex(salt),
      iterations
    };
  }

  static async verifyPassword(password, storedHashData) {
    if (!password || !storedHashData) return false;

    // Backward compatibility para hashes SHA-256 simples
    if (typeof storedHashData === 'string') {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashHex = this.bufferToHex(hashBuffer);
      return hashHex === storedHashData;
    }

    // Verificación PBKDF2
    const { hash, salt, iterations } = storedHashData;
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: this.hexToBuffer(salt), iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );

    return this.bufferToHex(derivedBits) === hash;
  }
}
