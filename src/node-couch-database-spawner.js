module.exports = {
    spawn: function (options) {
        var _fs = require('fs'),
            _nodeCouch = require('node-couch'),
            _path = require('path'),
            _options = Object.assign({}, options),
            _couchDb = new _nodeCouch.Client().initialize(_options.nodeCouch),
            _databases = [],
            _databasesPath = _options.databasesPath || _path.join(process.cwd(), './databases/'),
            _docTypes = 0,
            _docTypeCount = 0,
            _done = function () {
                _databases.forEach(function (database) {
                    (function (db) { // Re-scope database object
                        var _spawn = function(_db) {
                            _couchDb.Database.create(function (databaseError, databaseResponse) {
                                if (databaseError) {
                                    console.log(Color.red('Failed to spawn database: ' + db.id));

                                    return;
                                }

                                console.log(Color.green('Spawned database: ' + db.id));
                                this.parent().Document.Bulk.create(database.documents, function (documentsError, documentsResponse) {
                                    if (documentsError) {
                                        console.log(Color.red('Failed to bulk spawn documents'));

                                        return;
                                    }

                                    0 < documentsResponse.failed.length && console.log(Color.red('Failed to bulk spawn: ' + documentsResponse.failed.length + ' out of: ' + documentsResponse.response.length + ' documents'));
                                    0 < documentsResponse.successful.length && console.log(Color.green('Successfully bulk spawned: ' + documentsResponse.successful.length + ' out of: ' + documentsResponse.response.length + ' documents'));

                                    var _self = this;
                                    db.designs.forEach(function (design) {
                                        (function (designDoc) { // Re-scope design document object
                                            _self.parent().parent().Design.create(designDoc, function (designDocError, designDocResponse) {
                                                if (documentsError) {
                                                    console.log(Color.red('Failed to spawn design document: ' + designDoc._id));

                                                    return;
                                                }

                                                console.log(Color.green('Spawned design document: ' + designDoc._id));
                                            });
                                        })(design);
                                    });
                                });
                            });
                        };

                        _couchDb.Database.select(db.id)
                            .exists(function (error, response) {
                                if (error) {
                                    if (error.error && 404 === error.error.statusCode) {
                                        console.log(Color.green('Database: ' + db.id + ' doesn\'t exist, spawning...'));

                                        _spawn(db);

                                        return;
                                    }

                                    console.log(Color.red('General error, not spawning anything'));
                                    console.log(error);

                                    return;
                                }

                                console.log(Color.green('Database: ' + db.id + ' exists, deleting and respawning...'));
                                this.delete(function (databaseDeleteError, databaseDeleteResponse) {
                                    if (databaseDeleteError) {
                                        console.log(Color.red('Failed to delete database: ' + db.id + ', terminating'));
                                        console.log(databaseDeleteError);

                                        return;
                                    }

                                    _spawn(db);
                                });
                            });
                    })(database);
                });
            },
            Color = {
                green: function (text) {
                    return '\033[92m' + text + '\x1b[0m';
                },
                red: function (text) {
                    return '\033[91m' + text + '\x1b[0m';
                }
            };

        _fs.readdir(_databasesPath, function (databasesError, databases) { // Collect databases info to spawn
            if (databasesError) {
                console.error(Color.red('Failed to read databases'));
                console.error(databasesError);

                return;
            }

            databases.forEach(function (d) {
                var _databaseStat = _fs.statSync(_databasesPath + d),
                    _database = {
                        id: null,
                        designs: [],
                        documents: []
                    };
                if (_databaseStat.isDirectory()) {
                    _database.id = d.toLowerCase();

                    _fs.readdir(_databasesPath + d + '/', function (database, contentsError, contents) {
                        if (contentsError) {
                            console.error(Color.red('Failed to read contents in database: ' + database));
                            console.error(contentsError);

                            return;
                        }

                        contents.forEach(function (c) {
                            var _contentStat = _fs.statSync(_databasesPath + d + '/' + c);
                            if (_contentStat.isDirectory()) {
                                _fs.readdir(_databasesPath + d + '/' + c + '/', function (type, contentByTypeError, contentByType) {
                                    if (contentByTypeError) {
                                        console.error(Color.red('Failed to read: ' + type + ', in database: ' + database));
                                        console.error(contentByTypeError);

                                        return;
                                    }

                                    if ('designs' === type) {
                                        contentByType.forEach(function (designDoc) {
                                            _database[type].push(require(_path.resolve(_databasesPath + d + '/' + type + '/' + designDoc)));
                                        });
                                    }
                                    else if ('documents' === type) {
                                        _docTypes = contentByType.length;
                                        contentByType.forEach(function (docType) {
                                            var _docTypeStat = _fs.statSync(_databasesPath + d + '/' + type + '/' + docType + '/');
                                            if (!_docTypeStat.isDirectory()) {
                                                (_docTypes === ++_docTypeCount) && _done();
                                            }
                                            else {
                                                _fs.readdir(_databasesPath + d + '/' + type + '/' + docType + '/', function (documentsError, documents) {
                                                    if (documentsError) {
                                                        console.error(Color.red('Failed to read documents for type: ' + contentByType + ', in database: ' + database));
                                                        console.error(documentsError);

                                                        return;
                                                    }

                                                    documents.forEach(function (doc) {
                                                        var _docStat = _fs.statSync(_databasesPath + d + '/' + type + '/' + docType + '/' + doc);
                                                        if (_docStat.isFile()) {
                                                            var _document = require(_path.resolve(_databasesPath + d + '/' + type + '/' + docType + '/' + doc));
                                                            _document.type = docType;

                                                            _database[type].push(_document);
                                                        }
                                                    });

                                                    (_docTypes === ++_docTypeCount) && _done();
                                                });
                                            }
                                        });
                                    }
                                }.bind(null, c));
                            }
                        });
                    }.bind(null, d));

                    _databases.push(_database);
                }
            });
        });
    }
};