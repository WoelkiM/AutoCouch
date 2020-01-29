export function standardCatch<T>(loc: string): ((err: any) => T) {
    return function(err: any) {
    console.log("Error in %s: %s", loc, err);
        throw err;
    }
}