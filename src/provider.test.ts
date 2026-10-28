import { expect, it, vi } from "vitest";
import { createEmbeddingInstance } from "./provider";
import type { JsonValue } from "@tau/plugins";

const config = { baseUrl: "https://api.test/v1/", apiKey: "test-key" };
const signal = () => new AbortController().signal;
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });

it("请求账号地址的 embeddings 接口并透传取消信号", async () => {
  const calls: [string, RequestInit | undefined][] = [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push([String(url), init]);
    return json({
      data: [
        { embedding: [0.1, 0.2], index: 0 },
        { embedding: [0.3, 0.4], index: 1 },
      ],
    });
  };
  const instance = createEmbeddingInstance(config, "text-embedding-3-small", fetcher);
  const requestSignal = signal();
  const result = await instance.embed(["第一条", "第二条"], requestSignal);
  expect(calls[0][0]).toBe("https://api.test/v1/embeddings");
  expect(calls[0][1]).toMatchObject({
    method: "POST",
    headers: {
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    },
    signal: requestSignal,
  });
  expect(
    JSON.parse((calls[0][1] as RequestInit).body as string),
  ).toEqual({
    model: "text-embedding-3-small",
    input: ["第一条", "第二条"],
    encoding_format: "float",
  });
  expect(result).toEqual([
    [0.1, 0.2],
    [0.3, 0.4],
  ]);
});

it("按返回的 index 重排向量，与输入文本同序", async () => {
  const instance = createEmbeddingInstance(
    config,
    "text-embedding-3-small",
    async () =>
      json({
        data: [
          { embedding: [0.4, 0.5], index: 1 },
          { embedding: [0.1, 0.2], index: 0 },
          { embedding: [0.7], index: 2 },
        ],
      }),
  );
  expect(await instance.embed(["一", "二", "三"], signal())).toEqual([
    [0.1, 0.2],
    [0.4, 0.5],
    [0.7],
  ]);
});

it("接口报错时带上服务端 message，读不到时只报状态码", async () => {
  const failure = createEmbeddingInstance(
    config,
    "text-embedding-3-small",
    async () => json({ error: { message: "invalid api key" } }, 401),
  );
  await expect(
    failure.embed(["文本"], signal()),
  ).rejects.toThrow("嵌入接口请求失败（HTTP 401）：invalid api key");
  const unreadable = createEmbeddingInstance(
    config,
    "text-embedding-3-small",
    async () =>
      new Response("服务不可用", {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
  );
  await expect(unreadable.embed(["文本"], signal())).rejects.toThrow(
    "嵌入接口请求失败（HTTP 500）",
  );
});

it("拒绝条数不符、非数字向量与缺失的序号", async () => {
  const instance = (data: unknown) =>
    createEmbeddingInstance(config, "text-embedding-3-small", async () =>
      json({ data }),
    );
  await expect(
    instance([{ embedding: [0.1], index: 0 }]).embed(["一", "二"], signal()),
  ).rejects.toThrow("条数与输入文本不一致");
  await expect(
    instance([{ embedding: [0.1, "x"], index: 0 }]).embed(["一"], signal()),
  ).rejects.toThrow("无效的向量数据");
  await expect(
    instance([{ embedding: [], index: 0 }]).embed(["一"], signal()),
  ).rejects.toThrow("无效的向量数据");
  await expect(
    instance([{ embedding: [0.1], index: 1.5 }]).embed(["一"], signal()),
  ).rejects.toThrow("序号无效");
  await expect(
    instance([
      { embedding: [0.1], index: 0 },
      { embedding: [0.2], index: 0 },
    ]).embed(["一", "二"], signal()),
  ).rejects.toThrow("缺少第 2 条");
});

it("配置缺失或字段为空时在创建实例即报错，不发请求", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => json({ data: [] }));
  expect(() =>
    createEmbeddingInstance(
      undefined as unknown as JsonValue,
      "m",
      fetcher,
    ),
  ).toThrow("请先在插件设置中填写 API Key 与模型地址");
  expect(() => createEmbeddingInstance([], "m", fetcher)).toThrow(
    "请先在插件设置中填写 API Key 与模型地址",
  );
  expect(() =>
    createEmbeddingInstance({ baseUrl: "https://api.test/v1" }, "m", fetcher),
  ).toThrow("请先在插件设置中填写 API Key 与模型地址");
  expect(() =>
    createEmbeddingInstance({ apiKey: "k", baseUrl: "" }, "m", fetcher),
  ).toThrow("请先在插件设置中填写 API Key 与模型地址");
  expect(fetcher).not.toHaveBeenCalled();
});
