export class BuggySearchController {
    results: string[] = [];
  
    async search(
      query: string,
      fetchResults: (query: string) => Promise<string[]>
    ): Promise<void> {
      // Bug: every response updates state, even if it is stale.
      this.results = await fetchResults(query);
    }
  }