export function filterSearchResults(
    results: string[],
    query: string
  ): string[] {
    const normalizedQuery = query.trim().toLowerCase();
  
    return results.filter((result) =>
      result.toLowerCase().includes(normalizedQuery)
    );
  }