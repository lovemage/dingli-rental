export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (/\/video\/upload\//i.test(url)) return true;
  return /\.(mp4|webm|mov|m4v)(?:\?.*)?$/i.test(url);
}

export function normalizePropertyMediaOrder(urls: string[]): string[] {
  const cleaned = urls.filter(Boolean);
  const videos = cleaned.filter(isVideoUrl).slice(0, 2);
  const images = cleaned.filter((u) => !isVideoUrl(u));

  // 影片不可作為封面，封面固定第一張圖片。
  if (images.length === 0) return [];

  const ordered: string[] = [];
  ordered.push(images[0]);
  if (videos[0]) ordered.push(videos[0]);
  if (videos[1]) ordered.push(videos[1]);
  ordered.push(...images.slice(1));
  return ordered;
}
