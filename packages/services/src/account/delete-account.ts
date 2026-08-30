export type AccountDeletionRepository = {
  deleteAuthUser(ownerId: string): Promise<void>;
  deletePrivateFiles(ownerId: string): Promise<void>;
};

export async function deleteAccount(
  ownerId: string,
  repository: AccountDeletionRepository,
) {
  await repository.deletePrivateFiles(ownerId);
  await repository.deleteAuthUser(ownerId);
}
