import type { KlixPage } from './openapi.js';

export async function* iterateAllPages<T>(
  getPage: (nextUrl?: string) => Promise<KlixPage<T>>,
): AsyncGenerator<T, void, undefined> {
  let nextUrl: string | undefined;

  while (true) {
    const page = await getPage(nextUrl);
    const results = page.results ?? [];

    for (const item of results) {
      yield item;
    }

    if (!page.next) {
      return;
    }

    nextUrl = page.next;
  }
}
