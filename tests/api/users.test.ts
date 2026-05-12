import { beforeEach, describe, expect, it } from "vitest";
import {
  GET as listUsers,
  POST as createUser,
} from "@/app/api/users/route";
import {
  PATCH as patchUser,
  DELETE as deleteUser,
} from "@/app/api/users/[id]/route";
import {
  userListResponseSchema,
  userSingleResponseSchema,
} from "@/lib/contracts";
import { getRequest, jsonRequest, readJson, resetDb } from "../helpers";

describe("/api/users", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("GET auto-seeds 夫/妻 when empty and conforms to schema", async () => {
    const res = await listUsers();
    expect(res.status).toBe(200);
    const data = userListResponseSchema.parse(await readJson(res));
    const names = data.users.map((u) => u.name).sort();
    expect(names).toEqual(["夫", "妻"]);
  });

  it("GET returns existing users on subsequent calls", async () => {
    await listUsers(); // seeds
    const res2 = await listUsers();
    const data = userListResponseSchema.parse(await readJson(res2));
    expect(data.users).toHaveLength(2);
  });

  it("POST creates a user matching the schema", async () => {
    const res = await createUser(
      jsonRequest("http://test/api/users", { method: "POST", body: { name: "三人目" } }),
    );
    expect(res.status).toBe(200);
    const data = userSingleResponseSchema.parse(await readJson(res));
    expect(data.user.name).toBe("三人目");
    expect(data.user.color).toBeNull();
  });

  it("POST rejects empty name with 400", async () => {
    const res = await createUser(
      jsonRequest("http://test/api/users", { method: "POST", body: { name: "" } }),
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects extra-long name with 400", async () => {
    const tooLong = "あ".repeat(41);
    const res = await createUser(
      jsonRequest("http://test/api/users", { method: "POST", body: { name: tooLong } }),
    );
    expect(res.status).toBe(400);
  });

  it("PATCH renames an existing user", async () => {
    const list = userListResponseSchema.parse(await readJson(await listUsers()));
    const target = list.users[0];
    const res = await patchUser(
      jsonRequest(`http://test/api/users/${target.id}`, {
        method: "PATCH",
        body: { name: "夫(改名)" },
      }),
      { params: { id: target.id } },
    );
    expect(res.status).toBe(200);
    const data = userSingleResponseSchema.parse(await readJson(res));
    expect(data.user.name).toBe("夫(改名)");
  });

  it("DELETE removes a user", async () => {
    const list = userListResponseSchema.parse(await readJson(await listUsers()));
    const target = list.users[1];
    const res = await deleteUser(getRequest(`http://test/api/users/${target.id}`), {
      params: { id: target.id },
    });
    expect(res.status).toBe(200);
    const remaining = userListResponseSchema.parse(await readJson(await listUsers()));
    expect(remaining.users.find((u) => u.id === target.id)).toBeUndefined();
  });
});
