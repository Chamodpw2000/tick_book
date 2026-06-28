export type RequestInterceptor = (context: {
  url: string;
  init: RequestInit;
}) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

export type ResponseInterceptor = (context: {
  url: string;
  init: RequestInit;
  response: Response;
}) => Promise<Response> | Response;

export class HttpError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(message: string, options: { status: number; url: string; body: unknown }) {
    super(message);
    this.name = "HttpError";
    this.status = options.status;
    this.url = options.url;
    this.body = options.body;
  }
}

const joinUrl = (baseUrl: string, path: string) => {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
};

const safeReadBody = async (response: Response) => {
  if (response.status === 204) return null;

  try {
    if (isJsonResponse(response)) {
      return await response.json();
    }

    const text = await response.text();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
};

export const createHttpClient = (options: {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}) => {
  const requestInterceptors = options.requestInterceptors ?? [];
  const responseInterceptors = options.responseInterceptors ?? [];

  const request = async <TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> => {
    let url = joinUrl(options.baseUrl, path);

    const headers = new Headers(init.headers);
    if (options.defaultHeaders) {
      for (const [key, value] of Object.entries(options.defaultHeaders)) {
        if (!headers.has(key)) headers.set(key, value);
      }
    }

    let finalInit: RequestInit = {
      ...init,
      headers,
    };

    for (const interceptor of requestInterceptors) {
      const next = await interceptor({ url, init: finalInit });
      url = next.url;
      finalInit = next.init;
    }

    let response = await fetch(url, finalInit);

    for (const interceptor of responseInterceptors) {
      response = await interceptor({ url, init: finalInit, response });
    }

    if (!response.ok) {
      const body = await safeReadBody(response);
      const message = `Request failed (${response.status})`;
      throw new HttpError(message, { status: response.status, url, body });
    }

    return (await safeReadBody(response)) as TResponse;
  };

  return {
    request,
    get: <TResponse>(path: string, init?: RequestInit) => request<TResponse>(path, { ...init, method: "GET" }),
    delete: <TResponse>(path: string, init?: RequestInit) => request<TResponse>(path, { ...init, method: "DELETE" }),
    post: <TResponse>(path: string, body?: unknown, init?: RequestInit) =>
      request<TResponse>(path, {
        ...init,
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(init?.headers || {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    put: <TResponse>(path: string, body?: unknown, init?: RequestInit) =>
      request<TResponse>(path, {
        ...init,
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...(init?.headers || {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    patch: <TResponse>(path: string, body?: unknown, init?: RequestInit) =>
      request<TResponse>(path, {
        ...init,
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...(init?.headers || {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
  };
};

export const authBearerTokenInterceptor = (getToken: () => string | null | undefined): RequestInterceptor => {
  return ({ url, init }) => {
    const token = getToken();
    if (!token) return { url, init };

    const headers = new Headers(init.headers);
    if (!headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return { url, init: { ...init, headers } };
  };
};
