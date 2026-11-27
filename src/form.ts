import type { ProviderFormDeclaration } from "@tau/plugins";
import { messages } from "./i18n";

export const form: ProviderFormDeclaration = {
  groups: [
    {
      title: messages.ref("connection.title"),
      description: messages.ref("connection.description"),
      fields: [
        { key: "apiKey", label: messages.ref("connection.apiKey"), type: "secret" },
        {
          key: "baseUrl",
          label: messages.ref("connection.baseUrl"),
          type: "url",
          default: "https://api.openai.com/v1",
          description: messages.ref("connection.baseUrlHint"),
          summary: true,
        },
      ],
    },
  ],
  beforeSave: async values => {
    const baseUrl = values.baseUrl.trim();
    let protocol = "";
    try {
      protocol = new URL(baseUrl).protocol;
    } catch {
      // 无法解析时按地址格式错误处理
    }
    if (!["https:", "http:"].includes(protocol)) throw new Error("模型地址须为 HTTP 或 HTTPS 地址");
    return { ...values, baseUrl, apiKey: values.apiKey.trim() };
  },
};
