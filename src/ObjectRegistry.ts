import { AutoCouchCRDT } from './AutoCouchCRDT'
import { factory } from './CRDTFactory'

export class ObjectRegistry {
    
    private objects: Map<string, AutoCouchCRDT<any>>;

    constructor(objects?: Map<string, AutoCouchCRDT<any>>) {
        this.objects = objects ? objects : new Map();
    }

    public async getObject(objectId: string): Promise<AutoCouchCRDT<any>> {
        let res = this.objects.get(objectId);
        if(res) return res;
        return factory.loadObject(objectId);
    }

    public registerObject(objectId: string, object: AutoCouchCRDT<any>): void {
        if(this.objects.has(objectId)) {
            throw new Error('Object with this ID already exists');
        }
        this.objects.set(objectId, object);
    }

    public deregisterObject(objectId: string): void {
        this.objects.delete(objectId);
    }
}

export var registry = new ObjectRegistry();

export default registry;