# node-couch-database-spawner

> CouchDb database spawner for Node.Js using [node-couch](https://npmjs.com/package/node-couch)

## Installation
```shell
npm install node-couch-database-spawner --save
```

## NPM package
* https://npmjs.com/package/node-couch-database-spawner

## Usage
```js
var spawner = require('node-couch-database-spawner'),
        options = {
            databasesPath: './databases/',
            nodeCouch: { // node-couch options
               credentials: {
                   userName: 'user',
                   password: 'pass'
               },
               url: {
                   hostName: 'localhost',
                   port: 5984
               }
           }
        };

spawner.spawn(options);
```

## File/Folder structure
`node-couch-database-spawner` reads a local file/folder structure to build up database definitions to be spawned. Inside the `options.databasesPath` it is expected that the file/folder structure is as follows:
* [DatabaseName]: `Folder` - Can be chosen.
    * designs: `Folder` - Name must be `designs`.
        * [AnyNameDesignDocument].js: `File` - Design document specification (Node.Js JavaScript format). File name is irrelevant.
        * ... - Any amount.
    * documents: `Folder` - Name must be `documents`.
        * [DocumentType]: `Folder` - Containing documents divided by type. Each document under the folder will be augmented with a `type` property having the value of the folder name.
            * [AnyNameDocument].json: `File` - Document specification (JSON format). File name is irrelevant.
            * ... - Any amount.
        * ... - Any amount.

## Api
### Methods
#### .spawn(options)
(Re)Spawns CouchDb databases using the folder/files defined under `options.databasesPath`.

### Options
#### .databasesPath
`String`. `Optional`. Path to folder containing databases to be spawned, relative to current working directory. Defaults to: `./databases/`.

#### .nodeCouch
`Object`. `Required`. See [node-couch](https://npmjs.com/package/node-couch) initialization data.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Release History

 * 2019-02-08   v1.2.0   Fix for spawning partial databases.
 * 2017-10-26   v1.1.0   Fix for spawning multiple databases.
 * 2017-09-22   v1.0.0   Initial version.