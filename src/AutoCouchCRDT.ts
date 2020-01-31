import Automerge from 'automerge'
import uuid from 'uuid'
import { registry } from './ObjectRegistry'
import { db } from './Database'
import { standardCatch } from './Utils'

/**
 * Base type of the internal AutoCouch type that contains the ID and type of the object
 */
export type AutoCouchObject<T> = {
    objectId: string,
    objectType: string,
    object: T
}

/**
 * Abstract base that implements merging and replication of CRDTs.
 */
export abstract class AutoCouchCRDT<T> {

    private automergeDoc: Automerge.Doc<AutoCouchObject<T>>;
    private rev: any;
    private handlers: {(data?: any): void; }[];

    /**
     * Constructs a new AutoCouch object with either the type, id and object or from an internal Automerge document.
     * @param objectType type identifier
     * @param objectId unique object ID
     * @param object internal JSON object that needs to be pure
     * @param automergeDoc optional internal document. If it is defined the other parameters are ignored and the object is instantiated with this document instead.
     */
    constructor(objectType: string, objectId: string, object: T, automergeDoc?: Automerge.Doc<AutoCouchObject<T>>) {
        if(automergeDoc) {
            this.automergeDoc = automergeDoc;
        } else {
            let id = objectId ? objectId : uuid.v4();
            this.automergeDoc = Automerge.from({
                objectId: id,
                objectType: objectType,
                object: object
            });
            this.update();
        }
        try {
            registry.registerObject(this.getObjectId(), this);
        } catch {
            console.warn("Object does already exist in the registry. Ignore this if the object was created by loading from the registry.");
        }
        db.get(this.getObjectId()).then(result => this.mergeFunction(result)).catch(reason => {console.log(reason)});
        this.syncFunction();
        this.handlers = [];
    }

    /**
     * Registers handlers for the event of an update caused by syncing with the database.
     * @param handler function to be called when the objected is update by syncing with the database
     */
    public on(handler: { (data?: any): void }) : void {
        this.handlers.push(handler);
    }

    /**
     * Deregisters the given handler from update events.
     * @param handler function to be deregistered
     */
    public off(handler: { (data?: any): void }) : void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    private my_trigger():void {
        this.handlers.slice(0).forEach(h => h());
    }

    /**
     * Changes the internal object and replicates the changes.
     * @param changeFn callback that mutates the internal object
     */
    public async change(changeFn: (obj: T) => void) {
        this.automergeDoc = Automerge.change(this.automergeDoc, (automergeDoc) => {
            changeFn(automergeDoc.object);
        });
        await this.update();
    }

    /**
     * Gets the internal object.
     * @returns immutable version of the internal object
     */
    public getObject(): Automerge.Freeze<T> {
        return this.automergeDoc.object;
    }

    /**
     * Gets the object ID.
     * @returns ID of the object that is used in the registry and database
     */
    public getObjectId(): string {
        return this.automergeDoc.objectId;
    }

    /**
     * Gets the object type.
     * @returns type identifier of the object
     */
    public getObjectType(): string {
        return this.automergeDoc.objectType;
    }

    /**
     * Removes this object from the registry and database.
     */
    public async removeFromDatabase(): Promise<void> {
        registry.deregisterObject(this.getObjectId());
        await db.remove(this.getObjectId(), this.rev);
    }

    private syncFunction(): void {
        db.sync().on('change', (info: PouchDB.Replication.SyncResult<{}>) => {
            this.changeFunction(info);
        }).on('error', standardCatch("syncFunction"));
    }

    private changeFunction(info: PouchDB.Replication.SyncResult<{}>): void {
        let id = this.getObjectId();
        db.get(id, {conflicts: true})
        .then((value: PouchDB.Core.IdMeta & PouchDB.Core.GetMeta) => {
            this.conflictFunction(value,this);
            try {
                this.my_trigger();
            }catch(err) {
                standardCatch("myTrigger")(err);
            }
        }).catch(standardCatch("changeFunction"));
    }

    private conflictFunction(pouchDoc: any,obj:any): void {
        this.mergeFunction(pouchDoc);
        if (pouchDoc._conflicts) {
            for (let con of pouchDoc._conflicts) {
                try {
                    db.get(this.getObjectId(), {rev: con})
                        .then((pouchObject) => this.mergeFunction(pouchObject)).catch(function (err) {
                        obj.changeFunction();
                    });
                    db.remove(this.getObjectId(), con).catch(_err => {
                        obj.changeFunction();
                    });
                }catch (err) {
                    console.error(err);
                }
            }
            pouchDoc._conflicts = [];
            pouchDoc.changes = Automerge.getChanges(Automerge.init(), this.automergeDoc);
            db.put(pouchDoc).catch((err) => {
                obj.changeFunction();
            }).then(_ => db.get(this.getObjectId()).then(doc => this.rev = doc._rev));
        }
    }
    private mergeFunction(pouchDoc: any): void{
        this.rev = pouchDoc._rev;
        this.automergeDoc = Automerge.applyChanges(this.automergeDoc, pouchDoc.changes);
    }

    private update() {
        let changes = Automerge.getChanges(Automerge.init(), this.automergeDoc);
        let my_doc = {
            _id: this.getObjectId(),
            _rev: this.rev,
            changes: changes
        };
        db.put(my_doc).catch(reason => console.log(reason)).then(_ => db.get(this.getObjectId()).then(doc => this.rev = doc._rev));
    }
}

export function getDescendantProp(obj: any, path: string): any {
    if(path === '') return obj;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export default AutoCouchCRDT;