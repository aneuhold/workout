/**
 * Super simple password handler. This can potentially be used on the backend
 * perhaps. It isn't being used at the moment.
 */
export default class PasswordHandler {
  static async encryptPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return PasswordHandler.toHex(hash);
  }

  static async verifyPassword(password: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const passwordHash = await crypto.subtle.digest('SHA-256', data);
    return (
      PasswordHandler.toHex(passwordHash) ===
      '94e0f9bc7f5a5225bd141bad5adf9befcc112aef09b88f47a14e20b75a7bbec2'
    );
  }

  private static toHex(buffer: ArrayBuffer) {
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
