import * as bcrypt from 'bcrypt';

export class EncryptionService {
  /**
   * 문자열을 해시합니다 (주로 비밀번호 암호화용)
   */
  static async hash(data: string, rounds: number = 10): Promise<string> {
    return bcrypt.hash(data, rounds);
  }

  /**
   * 문자열과 해시를 비교합니다
   */
  static async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  /**
   * 간단한 Base64 인코딩 (민감하지 않은 데이터용)
   */
  static encodeBase64(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  /**
   * Base64 디코딩
   */
  static decodeBase64(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  /**
   * 난수 문자열 생성 (토큰, 인증 코드 등)
   */
  static generateRandomString(length: number = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
