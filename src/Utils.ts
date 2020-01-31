/**
 * Logs the location an error occured in and rethrows it.
 * @param loc string describing the location the error is caught in
 */
export function standardCatch<T>(loc: string): ((err: any) => T) {
    return function(err: any) {
    console.log("Error in %s: %s", loc, err);
        throw err;
    }
}