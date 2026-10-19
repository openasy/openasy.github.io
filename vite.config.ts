import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  // @openasy/ui is linked from ../ui while it is unpublished; use one copy of React.
  resolve: { dedupe: ["react", "react-dom", "lucide-react"] },
});
