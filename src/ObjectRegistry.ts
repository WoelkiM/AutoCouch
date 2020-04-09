import { AutoCouchCRDT } from './AutoCouchCRDT';
import { factory } from './CRDTFactory';

/**
 * The ObjectRegistry is able to store and retrieve AutoCouchCRDT objects by their ID.
 * It also doubles as a cache.
 */
class ObjectRegistry {
  private objects: Map<string, AutoCouchCRDT<unknown>>;

  constructor(objects?: Map<string, AutoCouchCRDT<unknown>>) {
    this.objects = objects ? objects : new Map();
  }

  /**
   * Returns the object registered under the given ID.
   * If the object is not found in the registry an attempt is made to build it
   * from the database.
   * @param objectId unique string that identifies the object in the Registry
   * @returns Promise object in the registry or a new object instance built from the database.
   * @throws if the object is not found in the database.
   */
  public async getObject(objectId: string): Promise<AutoCouchCRDT<unknown>> {
    const res = this.objects.get(objectId);
    if (res) return res;
    return factory.loadObject(objectId);
  }

  /**
   * Registers an object with the given ID in the registry.
   * @param objectId unique ID of the object to be registered
   * @param object reference to the AutoCouchCRDT object to be registered
   * @throws if the ID is already taken
   */
  public registerObject(objectId: string, object: AutoCouchCRDT<unknown>): void {
    if (this.objects.has(objectId)) {
      throw new Error('Object with this ID already exists');
    }
    this.objects.set(objectId, object);
  }

  /**
   * Deletes the entry with the given ID from the registry.
   * @param objectId unique ID of the object to be deregistered.
   */
  public deregisterObject(objectId: string): void {
    this.objects.delete(objectId);
  }
}

export const registry = new ObjectRegistry();

export default registry;
