import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  hello: t.procedure.query(() => {
    return { greeting: 'Hello from tRPC!' };
  }),
  generateText: t.procedure.input(z.object({ prompt: z.string() })).mutation(async ({ input }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('Missing OpenRouter API key');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e2b-it:free',
        messages: [
          { role: 'user', content: input.prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error('Failed to fetch from OpenRouter');
    const data = await res.json();
    // OpenRouter returns choices[0].message.content
    return { text: data.choices?.[0]?.message?.content || '' };
  }),
  generateImage: t.procedure
    .input(z.object({ prompt: z.string(), model: z.string().optional() }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.STABILITY_API_KEY;
      if (!apiKey) throw new Error("Missing Stability API key");

      // Use SDXL as default model
      const model = input.model || "stable-diffusion-xl-1024-v1-0";
      const endpoint = `https://api.stability.ai/v1/generation/${model}/text-to-image`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text_prompts: [{ text: input.prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Stability AI error:", errorText);
        throw new Error("Failed to fetch from Stability AI");
      }

      const data = await response.json();

      const imageBase64 = data.artifacts?.[0]?.base64;
      if (!imageBase64) throw new Error("No image received from Stability AI");

      return {
        image: `data:image/png;base64,${imageBase64}`,
      };
    }),
});

export type AppRouter = typeof appRouter;