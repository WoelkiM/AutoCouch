import Automerge from 'automerge'
import { AutoCouchCRDT, AutoCouchObject } from './AutoCouchCRDT'
import { db } from './Database'
import { standardCatch } from './Utils'

class CRDTFactory {

    private createFunctions: Map<string, (...parameters: any) => AutoCouchCRDT<any>>;
    private loadFunctions: Map<string, (doc: Automerge.Doc<any>) => AutoCouchCRDT<any>>;

    public constructor() {
        this.createFunctions = new Map();
        this.loadFunctions = new Map();
    }

    public registerType<R, T extends AutoCouchCRDT<R>>(typeName: string, createFunction: (...parameters: any) => T, loadFunction: (doc: Automerge.Doc<R>) => T) {
        this.createFunctions.set(typeName, createFunction);
        this.loadFunctions.set(typeName, loadFunction);
    }

    public createObject<R, T extends AutoCouchCRDT<R>>(typeName: string, ...parameters: any): T {
        let create = this.createFunctions.get(typeName);
        if(create) {
            return <T>create(...parameters);
        } else {
            throw new Error("CreateFunction not defined for " + typeName);
        }
    }

    public async loadObject<R, T extends AutoCouchCRDT<R>>(objectId: string): Promise<T> {
        return db.get(objectId).then((doc: any) => {
            let automergeDoc: Automerge.Doc<AutoCouchObject<R>> = Automerge.applyChanges(Automerge.init(), doc.changes);
            let typeName = automergeDoc.objectType;
            let load = this.loadFunctions.get(typeName);
            if(load) {
                return <T>load(automergeDoc);
            } else {
                throw new Error("LoadFunction not defined for " + typeName);
            }
        }).catch(standardCatch("loadObject"));
    }
}

export var factory = new CRDTFactory();