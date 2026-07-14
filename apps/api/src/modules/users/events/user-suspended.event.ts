export class UserSuspendedEvent {
  static readonly EVENT_NAME = 'user.suspended' as const

  constructor(
    public readonly userId: string,
    public readonly fullName: string,
  ) {}
}
