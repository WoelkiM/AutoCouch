import { AutomergeCRDT } from './AutomergeCRDT'
import { factory } from './CRDTFactory'

export class ObjectRegistry {
    
    private objects: Map<string, AutomergeCRDT<any>>;

    constructor(objects?: Map<string, AutomergeCRDT<any>>) {
        this.objects = objects ? objects : new Map();
    }

    public async getObject(objectId: string): Promise<AutomergeCRDT<any>> {
        let res = this.objects.get(objectId);
        if(res) return res;
        return factory.loadObject(objectId);
    }

    public registerObject(objectId: string, object: AutomergeCRDT<any>): void {
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