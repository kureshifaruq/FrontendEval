export class SearchController {
    results: string[] = [];
    private latestRequestId = 0;
  
    async search(
      query: string,
      fetchResults: (query: string) => Promise<string[]>
    ): Promise<void> {
      const requestId = ++this.latestRequestId;
      const response = await fetchResults(query);
  
      // Ignore responses from older requests.
      if (requestId !== this.latestRequestId) {
        return;
      }
  
      this.results = response;
    }
  }