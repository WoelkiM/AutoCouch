import { db } from '../Database'
import TestCRDT from "../__mocks__/TestCRDT";

describe("AutomergeCRDT_Suite", function() {
    afterAll(() => {
        //db.clean();
    })
    describe("The update handler", function() {
        var crdt: TestCRDT;
        beforeEach(()=>{
            crdt = new TestCRDT();
        });
        afterEach(() => {
            crdt.removeFromDatabase();
        });
        it("is registered", function () {
            crdt.on(() => {
                crdt.setTestFlag(true);
            });
            expect(crdt.retrieveHandlers()).toBeDefined();
            expect(crdt.retrieveHandlers().length).toBe(1);
        });
        it("is deregistered", function () {
            var test = () => {
                var a = "ok";
            };
            crdt.on(test);
            crdt.off(test);

            expect(crdt.retrieveHandlers()).toBeDefined();
            expect(crdt.retrieveHandlers().length).toBe(0);
        });
        // Integration tests
        test("is called from the database (change the Document)", function () {
            let handler = {
                handle: function() {
                    //crdt.setTestFlag(true);
                    console.log("handle");
                }
            }
            crdt.on(handler.handle);
            spyOn(handler, "handle");
            db.sync().emit("change");
            expect(handler.handle).toHaveBeenCalled();
            expect(crdt.getTestFlag()).toBe(true);
        });
        it("is called from the database with an error (change the Document)", function () {
            let handler = {
                handle: function() {
                    //crdt.setTestFlag(true);
                    console.log("handle");
                }
            }
            crdt.on(handler.handle);
            spyOn(handler, "handle");
            try {
                db.sync().emit("error");
                expect(handler.handle).not.toHaveBeenCalled();
            } catch (err) {
                expect(err).toEqual(Error("error occur"));
            }
        });
    });
    describe("The document is changed", () => {
        var crdt: TestCRDT;
        beforeEach(() => {
            crdt = new TestCRDT();
        });
        afterEach(() => {
            crdt.removeFromDatabase();
        });
        it("locally", () => {
            crdt.setTestFlag(true)
            expect(crdt.getTestFlag()).toBe(true);
        });
    });
    describe("The internal object", () => {
        var crdt: TestCRDT;
        beforeEach(() => {
            crdt = new TestCRDT();
        });
        afterEach(() => {
            crdt.removeFromDatabase();
        });
        it("is defined", () => {
            crdt.setTestFlag(true);
            expect(crdt.getObject()).toBeDefined();
            expect(crdt.getObject().testFlag).toBe(true);
        });
    });
});