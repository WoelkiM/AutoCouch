import PouchDB from 'pouchdb'
import { standardCatch } from './Utils'

/**
 * Wrapper for two PouchDB instances that represent the remote and local replication.
 * It especially provides a sync object to subscribe to database changes.
 */
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

    /**
     * Destroys both databases and instantiates them at the same location.
     * @returns Promise<void> that is resolved when both databases are instantiated.
     * @throws if the database either could not be deleted or instantiated.
     */
    public async clean(): Promise<void> {
        await this.localpouchDB.info().then(async info => {
            let name = info.db_name;
            await this.localpouchDB.destroy().then(_ => {
                this.localpouchDB = new PouchDB(name);
            });
        }).catch(standardCatch("clean"));
        await this.globalpouchDB.info().then(async info => {
            let name = info.db_name;
            await this.globalpouchDB.destroy().then(_ => {
                this.globalpouchDB = new PouchDB(name);
            });
        }).catch(standardCatch("clean"));
    }

    /**
     * Gets the doc stored in the database at the ID. See PouchDB documentation for details.
     * @param docId unique identifier string of the document to get.
     * @param options optional parameter passed to the PouchDB. See PouchDB documentation for details.
     * @returns Promise of the database content at the given ID.
     */
    public get(docId: string, options?: PouchDB.Core.GetOptions | undefined): Promise<PouchDB.Core.IdMeta & PouchDB.Core.GetMeta> {
        if(options) return this.localpouchDB.get(docId, options);
        return this.localpouchDB.get(docId);
    }

    /**
     * Puts the given PouchDB document into the database. See PouchDB documentation for details.
     * @param doc PouchDB document, needs to contain fields _id and _rev.
     * @param options optional parameter passed to PouchDB. See PouchDB documentation for details.
     */
    public put(doc: any, options?: PouchDB.Core.PutOptions | undefined): Promise<PouchDB.Core.Response> {
        if(options) return this.localpouchDB.put(doc, options);
        return this.localpouchDB.put(doc);
    }

    /**
     * Gives access to the Sync object associated with the database.
     * See PouchDB documentation for details.
     */
    public sync(): PouchDB.Replication.Sync<{}> {
        return this.syncObject;
    }

    /**
     * Marks the given revision of the given document as deleted.
     * @param docId Identifier of the document to remove.
     * @param revision Revision of the document to remove
     * @param options optional parameter passed to PouchDB. See PouchDB documentation for details.
     */
    public remove(docId: PouchDB.Core.DocumentId,
                  revision: PouchDB.Core.RevisionId,
                  options?: PouchDB.Core.Options): Promise<PouchDB.Core.Response>{
        if(options) return this.localpouchDB.remove(docId,revision, options);
        return this.localpouchDB.remove(docId,revision);
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