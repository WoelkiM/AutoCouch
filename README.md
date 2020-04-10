# AutoCouch

AutoCouch is a TypeScript framework to create object-oriented CRDTs that supports a simple way of distribution.

## Usage

To use AutoCouch in your project add it by installing it via npm:

```
npm i autocouch
```

### Creating Your Own CRDT

To define CRDTs the following steps are necessary:
1. Define the user data in pure JSON that should be contained in the CRDT.
2. Define the object-oriented interface of the CRDT.
3. Extend ``AutoCouchCRDT``.
4. Use the ``change`` function with the fitting callback to implement your interface and mutate your user data.
5. Use ``CRDTFactory.registerType(...)`` to pass the correct parameters to the constructor to create and load your object.

### Handling External Updates

When an update on an object was caused by another node the local replications are notified.
To handle the update one can register handlers via the ``AutoCouchCRDT.on(...)`` function.
If a handler is not needed anymore it can be removed via ``AutoCouchCRDT.off(...)``.

### Using the Database and ObjectRegistry

In some special cases like an object-oriented container CRDT manually using the ``ObjectRegistry`` and ``Database`` might be helpful.
``Database`` is a simplified wrapper of a [PouchDB](https://pouchdb.com/api.html) that allows getting and putting documents.
It can be used to save special documents of your application under a globally known ID.

``ObjectRegistry`` is a simple registry and cache that stores an object under its ID and loads it from the database if it is not found.
It can be used to reference objects from a CRDT container.

### Example Usage

An example of how the framework is integrated in a React based web-app can be found at [Polly](https://github.com/WoelkiM/Polly_React_Example_AutoCouch).
