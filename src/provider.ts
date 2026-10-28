import type { EmbeddingInstance, JsonValue } from "@tau/plugins";

interface EmbeddingResponse {
  error?: { message?: unknown };
  data?: unknown;
}

function parseEmbeddingResponse(raw: string): EmbeddingResponse {
  try {
    const payload: unknown = JSON.parse(raw);
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as EmbeddingResponse)
      : {};
  } catch {
    return {};
  }
}

export function createEmbeddingInstance(
  config: JsonValue,
  modelId: string,
  fetcher: typeof fetch,
): EmbeddingInstance {
  const stored = config && typeof config === "object" && !Array.isArray(config)
    ? (config as { apiKey?: unknown; baseUrl?: unknown })
    : {};
  const apiKey = typeof stored.apiKey === "string" ? stored.apiKey.trim() : "";
  const baseUrl =
    typeof stored.baseUrl === "string"
      ? stored.baseUrl.trim().replace(/\/+$/, "")
      : "";
  const model = modelId.trim();
  if (!apiKey || !baseUrl)
    throw new Error("请先在插件设置中填写 API Key 与模型地址");

  return {
    embed: async (texts, signal) => {
      signal.throwIfAborted();
      const response = await fetcher(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: texts,
          encoding_format: "float",
        }),
        signal,
      });
      const payload = parseEmbeddingResponse(await response.text());
      if (!response.ok) {
        const message =
          typeof payload.error?.message === "string" && payload.error.message.trim()
            ? payload.error.message
            : "";
        throw new Error(
          message
            ? `嵌入接口请求失败（HTTP ${response.status}）：${message}`
            : `嵌入接口请求失败（HTTP ${response.status}）`,
        );
      }
      if (!Array.isArray(payload.data) || payload.data.length !== texts.length)
        throw new Error("嵌入接口返回的向量条数与输入文本不一致");
      const slots: (number[] | undefined)[] = new Array(texts.length);
      for (const item of payload.data) {
        const entry =
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as { embedding?: unknown; index?: unknown })
            : {};
        if (
          !Number.isInteger(entry.index) ||
          (entry.index as number) < 0 ||
          (entry.index as number) >= texts.length
        )
          throw new Error("嵌入接口返回的向量序号无效");
        const embedding = entry.embedding;
        if (
          !Array.isArray(embedding) ||
          embedding.length === 0 ||
          embedding.some(value => typeof value !== "number")
        )
          throw new Error("嵌入接口返回了无效的向量数据");
        slots[entry.index as number] = embedding;
      }
      const vectors: number[][] = [];
      for (const [index, vector] of slots.entries()) {
        if (vector === undefined)
          throw new Error(`嵌入接口返回的向量缺少第 ${index + 1} 条`);
        vectors.push(vector);
      }
      return vectors;
    },
  };
}
