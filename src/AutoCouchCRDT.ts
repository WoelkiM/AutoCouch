import Automerge from 'automerge'
import uuid from 'uuid'
import { registry } from './ObjectRegistry'
import { db } from './Database'

export type AutoCouchObject<T> = {
    objectId: string,
    objectType: string,
    object: T
}

export abstract class AutoCouchCRDT<T> {

    private automergeDoc: Automerge.Doc<AutoCouchObject<T>>;
    private rev: any;
    private handlers: {(data?: any): void; }[];

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

    public on(handler: { (data?: any): void }) : void {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: any): void }) : void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    private my_trigger():void {
        this.handlers.slice(0).forEach(h => h());
    }

    public async change(changeFn: (obj: T) => void) {
        this.automergeDoc = Automerge.change(this.automergeDoc, (automergeDoc) => {
            changeFn(automergeDoc.object);
        });
        await this.update();
    }

    public getObject(): Automerge.Freeze<T> {
        return this.automergeDoc.object;
    }

    public getObjectId(): string {
        return this.automergeDoc.objectId;
    }

    public getObjectType(): string {
        return this.automergeDoc.objectType;
    }

    public removeFromDatabase(): void {
        registry.deregisterObject(this.getObjectId());
        db.remove(this.getObjectId(), this.rev);
    }

    private syncFunction(): void {
        db.sync().on('change', (info: PouchDB.Replication.SyncResult<{}>) => {
            this.changeFunction(info);
        }).on('error', function (err) {
            throw Error("error occur" );//+ err.toString());
        });
    }

    private changeFunction(info: PouchDB.Replication.SyncResult<{}>): void {
        let id = this.getObjectId();
        db.get(id, {conflicts: true})
        .then((value: PouchDB.Core.IdMeta & PouchDB.Core.GetMeta) => {
            this.conflictFunction(value,this);
            try {
                this.my_trigger();
            }catch(err) {
                console.log(err);
            }
        }).catch(function (err) {
            throw Error("error occur" + err.toString());
        });
    }

    private conflictFunction(pouchDoc: any,obj:any): void {
        this.mergeFunction(pouchDoc);
        if (pouchDoc._conflicts) {
            for (let con of pouchDoc._conflicts) {
                try {
                    db.get(this.getObjectId(), {rev: con})
                        .then((pouchObject) => this.mergeFunction(pouchObject)).catch(function (err) {
                        //TODO: If an error occurs, the changeFunction is called again. Please check.
                        obj.changeFunction();
                        // throw Error("error occur" + err.toString());
                    });
                    db.remove(this.getObjectId(), con).catch(err => {
                        console.error(err);
                        obj.changeFunction();
                    });
                }catch (err) {
                    //TODO: i´m not 100% sure if this try/catch is needed.
                    //throw Error("error occur" + err.toString());
                }
            }
            //In the old version, this was outside the if clause. Please check.
            pouchDoc._conflicts = [];
            pouchDoc.changes = Automerge.getChanges(Automerge.init(), this.automergeDoc);
            db.put(pouchDoc).catch((err) => {
                obj.changeFunction();
                //throw Error("error occur" + err.toString());
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