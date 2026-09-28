import type { Config } from "@netlify/functions";
import submit from "../../submit.js";

// Netlify version of POST /api/submit. Email settings come from the site's environment variables.
export default async (req: Request) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form submission." }, { status: 400 });
  }
  const file = form.get("photo");
  const photo = file instanceof File && file.size > 0
    ? { buffer: Buffer.from(await file.arrayBuffer()), mimetype: file.type }
    : null;
  const env = Object.fromEntries(
    ["HR_EMAIL", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"].map((k) => [k, Netlify.env.get(k)]),
  );
  const { status, body } = await submit.handleSubmission({
    get: (name: string) => {
      const v = form.get(name);
      return typeof v === "string" ? v : "";
    },
    photo,
    env,
  });
  return Response.json(body, { status });
};

export const config: Config = { path: "/api/submit" };
