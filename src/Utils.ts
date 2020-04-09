/**
 * Prints the location an error occured in.
 * @param loc string describing the location the error is caught in
 */
export function standardCatch<T>(loc: string): (err: any) => void {
  return (err: any) => {
    console.error('Error in %s: %s', loc, err);
  };
}
