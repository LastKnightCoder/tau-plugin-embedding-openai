# OpenAI Embeddings

Convert your notes into vectors for semantic search, so you can find related notes across your library using natural language. Works with OpenAI and other OpenAI-compatible embedding services.

## Getting Started

1. Install **OpenAI Embeddings** from the Plugin Center, then enable it under **Installed** on the Plugins page.
2. Open **Settings** on the plugin details page, enter your **API Key** and **Model endpoint**, and save.
3. Go to **Settings → Embeddings**, pick a model under **OpenAI Embeddings**, and click **Set as current**. After you confirm, Tau verifies the connection; once verified, click **Index now** under **Current model**.

Enter **Model endpoint** up to `/v1`, such as `https://api.openai.com/v1`, or use the URL provided by another compatible service. Preset models `text-embedding-3-small` and `text-embedding-3-large` are included by default, and vector dimensions are detected by Tau during verification.

## FAQ

**Does this incur usage fees?** Yes. Generating vectors is billed according to your provider's pricing; both indexing notes and running search queries call the embedding API.

**Are notes indexed automatically after enabling?** No. To avoid unexpected charges, newly created or edited notes are only updated when you click **Index now** in **Settings → Embeddings**.

**What happens when I switch embedding models?** After you confirm a model switch, Tau clears the existing index and rebuilds it with the new model, since vectors from different models cannot be mixed.

**Can I use another provider?** Yes. As long as the provider is compatible with the OpenAI embeddings API, change **Model endpoint** in the plugin settings to its URL.

## Notes

- Note content is sent to the configured model service. Make sure your provider's data policy meets your requirements.
- Treat your API Key like an account credential. Never share it with others or include it in screenshots or issue reports.
