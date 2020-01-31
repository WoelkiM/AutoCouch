import Automerge from 'automerge'
import { AutoCouchCRDT, AutoCouchObject } from './AutoCouchCRDT'
import { db } from './Database'
import { standardCatch } from './Utils'

/**
 * Factory class that enables creation and loading of arbitrary AutoCouchCRDT objects.
 */
class CRDTFactory {

    private createFunctions: Map<string, (...parameters: any) => AutoCouchCRDT<any>>;
    private loadFunctions: Map<string, (doc: Automerge.Doc<any>) => AutoCouchCRDT<any>>;

    public constructor() {
        this.createFunctions = new Map();
        this.loadFunctions = new Map();
    }

    /**
     * Registers functions to create and load objects of a given type.
     * @param typeName type ID of the object to be created
     * @param createFunction function that takes a parameter list and creates a new object
     * @param loadFunction function that takes an Automerge document and creates a new object
     */
    public registerType<R, T extends AutoCouchCRDT<R>>(typeName: string, createFunction: (...parameters: any) => T, loadFunction: (doc: Automerge.Doc<R>) => T) {
        this.createFunctions.set(typeName, createFunction);
        this.loadFunctions.set(typeName, loadFunction);
    }

    /**
     * Creates a new initial object of the given type with the given parameters.
     * @param typeName type ID of the object that is to be created
     * @param parameters list of parameters for the create function
     * @returns new instance of the given type
     * @throws if the type is not known to the factory
     */
    public createObject<R, T extends AutoCouchCRDT<R>>(typeName: string, ...parameters: any): T {
        let create = this.createFunctions.get(typeName);
        if(create) {
            return <T>create(...parameters);
        } else {
            throw new Error("CreateFunction not defined for " + typeName);
        }
    }

    /**
     * Loads an object with the given ID from the database and creates an instance.
     * @param objectId unique identifier of the object to be loaded
     * @returns a new instance of the object with the given ID
     * @throws if the load function for the object type is not defined
     */
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