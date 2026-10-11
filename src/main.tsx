import "@/styles/globals.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Providers } from "@/app/providers";
import { createQueryClient } from "@/app/query-client";
import { createAppRouter } from "@/app/router";
import { syncThemeWithDocument } from "@/lib/theme";

syncThemeWithDocument();

const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("index.html is missing #root");

createRoot(rootElement).render(
  <StrictMode>
    <Providers queryClient={queryClient} router={router} />
  </StrictMode>,
);
