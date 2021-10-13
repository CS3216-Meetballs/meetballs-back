/**
 * Payload stored in JWT token to uniquely identify user
 */
export interface TokenPayload {
  readonly userId: string;
  readonly authType: 'email';
  readonly tokenType: 'access_token' | 'refresh_token';
}

/**
 * Payload stored in Zoom's JWT token
 */
export interface ZoomTokenPayload {
  readonly userId: string;
  readonly clientId: string;
  readonly tokenType: 'refresh_token' | 'access_token';
  readonly exp: number;
  readonly nbf: number;
  readonly iat: number;
}
