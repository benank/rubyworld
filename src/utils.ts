export const downloadWithProgress = async (
  url: string,
  onProgress: (progress: number, loaded: number, total: number) => void
) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const contentLength = response.headers.get("content-length");
  if (!contentLength) {
    throw new Error("Unable to determine file size.");
  }

  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Unable to read the response body.");
  }

  const stream = new ReadableStream({
    start(controller) {
      async function push() {
        const { done, value } = await reader!.read();
        if (done) {
          controller.close();
          return;
        }
        loaded += value.length;
        if (onProgress) {
          onProgress(Math.min(99, (loaded / total) * 100), loaded, total); // Progress callback
        }
        controller.enqueue(value);
        push();
      }
      push();
    },
  });

  const blob = await new Response(stream).blob();
  return blob; // Return the downloaded content as a Blob
};
