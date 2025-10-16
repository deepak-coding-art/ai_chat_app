import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function getBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || "";
  if (!base)
    throw new Error(
      "API base URL is missing. Set EXPO_PUBLIC_API_URL or API_URL."
    );
  return base.replace(/\/$/, "");
}

function normalizeEndpoint(endpoint: string): string {
  const path = endpoint.replace(/^\//, "");
  return `${getBaseUrl()}/api/${path}`;
}

export async function apiRequest<TResponse = unknown, TBody = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, headers = {}, signal } = options;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isBodyMethod = method !== "GET";
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...headers,
  };
  if (session?.access_token) {
    finalHeaders.Authorization = `Bearer ${session.access_token}`;
  }
  // console.log("Authorization header: ", finalHeaders.Authorization);
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  console.debug("Calling endpoint:", normalizedEndpoint, "method:", method);
  // console.log("Final headers:", finalHeaders);
  const response = await fetch(normalizedEndpoint, {
    method,
    headers: finalHeaders,
    body: isBodyMethod && body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  console.debug(
    "Calling endpoint:",
    normalizedEndpoint,
    "responded:",
    response.status,
    "method:",
    method
  );

  const text = await response.text();
  const maybeJson = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (maybeJson && (maybeJson.message || maybeJson.error)) ||
      response.statusText;
    if (response.status === 401) {
      await supabase.auth.signOut();
      router.replace("/login");
    }
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  return maybeJson as TResponse;
}

export async function getChatMessages(chatId: string) {
  return apiRequest<{
    thread_id: string;
    messages: import("@/lib/types").Message[];
  }>(`chat/messages?chat_id=${chatId}`, { method: "GET" });
}

type StreamChatBody = { message: string; chat_id: string | null };

export async function streamChat(
  body: StreamChatBody,
  handlers: {
    onEvent: (event: import("@/lib/types").ChatEvent) => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const endpoint = normalizeEndpoint("chat");
        console.log("Calling sse endpoint:", endpoint);

        xhr.open("POST", endpoint, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "text/event-stream");

        if (session?.access_token) {
          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${session.access_token}`
          );
        }

        let buffer = "";

        xhr.onprogress = () => {
          // Get the accumulated response text
          const responseText = xhr.responseText;

          // Only process new data
          if (responseText.length > buffer.length) {
            const newData = responseText.slice(buffer.length);
            buffer = responseText;

            // Parse SSE events from the new data
            const lines = newData.split("\n");
            for (const line of lines) {
              const trimmedLine = line.trim();

              // SSE format: "data: {json}"
              if (trimmedLine.startsWith("data:")) {
                const jsonStr = trimmedLine.slice(5).trim();
                if (!jsonStr) continue;

                try {
                  const event = JSON.parse(jsonStr);
                  handlers.onEvent(event);
                } catch {
                  console.warn("Failed to parse SSE JSON:", jsonStr);
                }
              }
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error"));
        };

        xhr.onabort = () => {
          reject(new Error("Request aborted"));
        };

        // Handle abort signal
        if (handlers.signal) {
          handlers.signal.addEventListener("abort", () => {
            xhr.abort();
          });
        }

        xhr.send(
          JSON.stringify({
            message: body.message,
            chat_id: body.chat_id,
          })
        );
      })
      .catch(reject);
  });
}
