import { db } from '../components/crdts/automerge/Database'
import TestCRDT from "./mock/TestCRDT";

describe("AutomergeCRDT_Suite", function() {
    afterAll(() => {
        //db.clean();
    })
    describe("The update handler", function() {
        var crdt;
        beforeEach(()=>{
            crdt = new TestCRDT();
        });
        afterEach(() => {
            crdt.removeFromDatabase();
        });
        it("is registered", function () {
            crdt.on(() => {
                this.setTestFlag(true);
            });
            expect(crdt.handlers).toBeDefined();
            expect(crdt.handlers.length).toBe(1);
        });
        it("is deregistered", function () {
            var test = () => {
                var a = "ok";
            };
            crdt.on(test);
            crdt.off(test);

            expect(crdt.handlers).toBeDefined();
            expect(crdt.handlers.length).toBe(0);
        });
        // Integration tests
        it("is called from the database (change the Document)", function () {
            let handler = {
                handle: function() {
                    crdt.setTestFlag(true);
                }
            }
            crdt.on(handler.handle);
            spyOn(handler, "handle").and.callThrough();
            db.sync().emit("change");
            expect(handler.handle).toHaveBeenCalled();
            expect(crdt.getTestFlag()).toBeTrue();
        });
        it("is called from the database with an error (change the Document)", function () {
            let handler = {
                handle: function() {
                    crdt.setTestFlag(true);
                }
            }
            crdt.on(handler.handle);
            spyOn(handler, "handle").and.callThrough();
            try {
                db.sync().emit("error");
                expect(handler.handle).not.toHaveBeenCalled();
            } catch (err) {
                expect(err).toEqual(Error("error occur"));
            }
        });
    });
    describe("The document is changed", () => {
        var crdt;
        beforeEach(() => {
            crdt = new TestCRDT();
        });
        afterEach(() => {
            crdt.removeFromDatabase();
        });
        it("locally", () => {
            crdt.setTestFlag(true)
            expect(crdt.getTestFlag()).toBeTrue();
        });
    });
    describe("The internal object", () => {
        var crdt;
        beforeEach(() => {
            crdt = new TestCRDT();
        });
        afterEach(() => {
            crdt.removeFromDatabase();
        });
        it("is defined", () => {
            crdt.setTestFlag(true);
            expect(crdt.getObject()).toBeDefined();
            expect(crdt.getObject().testFlag).toBeTrue();
        });
    });
});

