import PouchDB from 'pouchdb'

class Database {

    private localpouchDB: PouchDB.Database<{}>;
    private globalpouchDB: PouchDB.Database<{}>;
    private syncObject: PouchDB.Replication.Sync<{}>

    constructor(local: string, global: string) {
        this.localpouchDB = new PouchDB(local);
        this.globalpouchDB = new PouchDB(global);
        this.syncObject = this.localpouchDB.sync(this.globalpouchDB, {
            live: true,
            retry: true,
        });
    }

    public clean(): void {
        this.localpouchDB.info().then(info => {
            let name = info.db_name;
            this.localpouchDB.destroy().then(_ => {
                this.localpouchDB = new PouchDB(name);
            });
        }).catch(this.standardCatch("clean"));
        this.globalpouchDB.info().then(info => {
            let name = info.db_name;
            this.globalpouchDB.destroy().then(_ => {
                this.globalpouchDB = new PouchDB(name);
            });
        }).catch(this.standardCatch("clean"));
    }

    public get(docId: string, options?: PouchDB.Core.GetOptions | undefined): Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta> {
        if(options) return this.localpouchDB.get(docId, options);
        return this.localpouchDB.get(docId);
    }

    public put(doc: any, options?: PouchDB.Core.PutOptions | undefined): Promise<PouchDB.Core.Response> {
        if(options) return this.localpouchDB.put(doc, options);
        return this.localpouchDB.put(doc);
    }

    public sync(): PouchDB.Replication.Sync<{}> {
        return this.syncObject;
    }

    public remove(docId: PouchDB.Core.DocumentId,
                  revision: PouchDB.Core.RevisionId,
                  options?: PouchDB.Core.Options): Promise<PouchDB.Core.Response>{
        if(options) return this.localpouchDB.remove(docId,revision, options);
        return this.localpouchDB.remove(docId,revision);
    }

    standardCatch<T>(loc: string): ((err: any) => T) {
        return function(err: any) {
        console.log("Error in %s: %s", loc, err);
            throw err;
        }
    }
}

switch(process.env.NODE_ENV) {
    case "test":
        db = new Database('testPouchDB', 'testCouchDB');
        break;
    default:
        let local = process.env.AUTOCOUCH_LOCAL_DB;
        let global = process.env.AUTOCOUCH_GLOBAL_DB;
        if(!local) {
            console.warn('Location of local PouchDB not set, using \'localPouchDB\'. Set the variable AUTOCOUCH_LOCAL_DB to use your own location.');
            local = 'localPouchDB';
        }
        if(!global) {
            console.warn('Address of global CouchDB not set, using local fallback \'globalPouchDB\'. Set the variable AUTOCOUCH_GLOBAL_DB to use your own address.');
            global = 'globalPouchDB';
        }
        db = new Database(local, global);
}

export var db: Database;