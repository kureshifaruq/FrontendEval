
export function parseQuantity(input: string): number | null {
    const quantity = Number.parseInt(input, 10);
  
    if (Number.isNaN(quantity) || quantity <= 0) {
      return null;
    }
  
    return quantity;
  }
    