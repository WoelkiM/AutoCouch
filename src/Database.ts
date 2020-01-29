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
        db = new Database('databasePouchDB', 'Please enter the server address here');
}

export var db: Database;