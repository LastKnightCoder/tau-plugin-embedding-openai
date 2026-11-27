import { messages } from "./i18n";
import { form } from "./form";
import { definePlugin } from "@tau/plugins";
import { createEmbeddingInstance } from "./provider";
declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  i18n: messages,
  create: () => ({
    activate(context) {
      if (!context.embeddings) throw new Error("请升级到支持嵌入插件接口的 Tau 客户端");
      context.embeddings.register({
        id: context.pluginId,
        name: "OpenAI 嵌入",
        maxBatchSize: 64,
        create: (config, modelId) => createEmbeddingInstance(config, modelId, context.fetch),
      });
      context.settings.register({
        id: "connection",
        title: "OpenAI 嵌入",
        target: "embeddings",
        models: [
          { id: "text-embedding-3-small", label: "text-embedding-3-small", dimensions: 1536 },
          { id: "text-embedding-3-large", label: "text-embedding-3-large", dimensions: 3072 },
        ],
        form,
      });
    },
  }),
});
