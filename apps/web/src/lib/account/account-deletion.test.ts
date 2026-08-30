import { deleteAccount } from "@petmosphere/services";
import { describe, expect, it, vi } from "vitest";

describe("deleteAccount", () => {
  it("removes private files before permanently deleting the auth user", async () => {
    const calls: string[] = [];
    await deleteAccount("owner-1", {
      deleteAuthUser: vi.fn(async () => {
        calls.push("auth");
      }),
      deletePrivateFiles: vi.fn(async () => {
        calls.push("files");
      }),
    });

    expect(calls).toEqual(["files", "auth"]);
  });

  it("keeps the account active when private-file cleanup fails", async () => {
    const deleteAuthUser = vi.fn();
    await expect(
      deleteAccount("owner-1", {
        deleteAuthUser,
        deletePrivateFiles: async () => {
          throw new Error("storage unavailable");
        },
      }),
    ).rejects.toThrow("storage unavailable");
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });
});
