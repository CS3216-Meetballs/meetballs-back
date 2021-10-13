/**
 * Payload stored in JWT token to uniquely identify user
 */
export interface TokenPayload {
  readonly userId: string;
  readonly tokenType: 'access_token' | 'refresh_token';
}
