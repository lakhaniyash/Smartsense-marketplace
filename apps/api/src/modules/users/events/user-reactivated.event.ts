export class UserReactivatedEvent {
  static readonly EVENT_NAME = 'user.reactivated' as const

  constructor(
    public readonly userId: string,
    public readonly fullName: string,
  ) {}
}
