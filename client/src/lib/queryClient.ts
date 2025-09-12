import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Procesar fechas para evitar el problema de "Expected date, received string"
  const processedData = data ? processDateObjects(data) : undefined;
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(processedData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Convierte objetos Date a strings ISO para enviarlos al servidor
function processDateObjects(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (data instanceof Date) {
    return data.toISOString(); // Convertir Date a string ISO
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      // Procesar arrays recursivamente
      return data.map(item => processDateObjects(item));
    } else {
      // Procesar objetos recursivamente
      const result: Record<string, any> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = processDateObjects(data[key]);
        }
      }
      return result;
    }
  }
  
  return data; // Devolver otros tipos sin cambios
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
