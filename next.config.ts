import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
