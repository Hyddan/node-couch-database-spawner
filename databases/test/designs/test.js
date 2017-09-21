module.exports = {
    _id: '_design/Test',
    language: 'javascript',
    views: {
        ById: {
            map: function (doc) {
                if ('Test' === doc.type) {
                    emit(doc.id, null);
                }
            }
        }
    }
};