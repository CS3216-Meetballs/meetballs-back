export interface GenerateParticipantMagicLinkPayload {
  readonly meetingId: string;
  readonly userEmail: string;
  readonly userName: string;
  readonly nonce: string;
}
