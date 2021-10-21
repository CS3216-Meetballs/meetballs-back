export interface Version0MagicPayload {
  readonly meetingId: string;
  readonly userEmail: string;
  readonly nonce: string;
}

export interface Version1MagicPayload {
  readonly ver: '1.0.0';
  readonly pid: string;
  readonly nce: string;
}

export type ParticipantMagicLinkPayload =
  | Version0MagicPayload
  | Version1MagicPayload;
