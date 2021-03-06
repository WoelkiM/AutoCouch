import AutomergeCRDT from "../AutoCouchCRDT";
import uuid from "uuid";

type TestObject = {
    testFlag: boolean
}

export class TestCRDT extends AutomergeCRDT<TestObject> {

    constructor() {
        super("Test", uuid.v4(), {testFlag: false}, undefined);
    }

    public getTestFlag(): boolean {
        return this.getObject().testFlag;
    }

    public setTestFlag(value: boolean): void {
        this.change(obj => {
            obj.testFlag = value;
        })
    }

    public retrieveHandlers(): ((data?: any) => void)[] {
        return this.getHandlers();
    }
}

export default TestCRDT;