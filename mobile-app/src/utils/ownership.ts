export function ownsReport(userId: string | undefined, ownerId: string): boolean {
  return Boolean(userId) && userId === ownerId;
}
