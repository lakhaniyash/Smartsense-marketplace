export class UserInvitedEvent {
  static readonly EVENT_NAME = 'user.invited' as const

  constructor(
    public readonly userId: string,
    public readonly fullName: string,
  ) {}
}
