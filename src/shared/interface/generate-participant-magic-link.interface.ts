export interface GenerateParticipantMagicLinkPayload {
  readonly meetingId: string;
  readonly userEmail: string;
  readonly nonce: string;
}
