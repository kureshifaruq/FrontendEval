
export class BuggyLoadingController {
    loading = false;
    error: string | null = null;
  
    async load(fetchData: () => Promise<string[]>): Promise<string[]> {
      this.loading = true;
      this.error = null;
  
      try {
        const data = await fetchData();
        this.loading = false;
        return data;
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Request failed";
        throw error;
      }
    }
  }
    