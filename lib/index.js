var Metalsmith = require('metalsmith'),
    contentful = require('contentful')
    _          = require('lodash')
    each       = require('async').each;

function tasks(options){
    enforcep(options, 'accessToken');
    enforcep(options, 'spaceId');

    var log = console.log.bind(console);
    var client = contentful.createClient({
        space:       options.spaceId,
        accessToken: options.accessToken,
    });

    return function(files, metalsmith, done){
        var keys      = Object.keys(files);
        var metadata  = {};
        var bck_files = files;
        
        each(keys, processFile, done);
        
        function processFile(file, fileProcessedCallback){
            metadata = files[file];
            createPages();
        }

        function entryProcessor(data, pageProcessedCallback) {
            file = {
                contents   : "", // Contents needs to be defined beacuse other plugins expect it
                template   : metadata.template,
                contentful : "contentful"
            };

            files[data.fields.url + '.html'] = file;
            console.log("Writing new file: "+data.fields.url + '.html');
            pageProcessedCallback();
        };

        function onSuccessfulEntriesFetch(pages) {
            each(pages, entryProcessor, done);
        };

        function onErroneousEntriesFetch(err) {
            console.log('An unexpected error happened while trying to fetch the entries (' + err.message +')');
            done();
        };

        function createPages(){
            client.contentTypes()
            .then(
                function(response){
                    var pages_content_type = getContentTypeByName(response, 'Pages').sys.id;
                    get_pages(pages_content_type);
                },function(err){
                        onErroneousEntriesFetch(err);
                    }
            );

            var get_pages = function(id){
                client.entries({content_type: id}).then(
                    function(response){
                        onSuccessfulEntriesFetch(response);
                    },function(err){
                        onErroneousEntriesFetch(err);
                    }
                );
            }
        };
    }
};

function exists(value){
    return value != null;
}

function enforcep(object, property) {
    if (!exists(object[property]))
        throw new TypeError('Expected property ' + property);
}

var getContentTypeByName = function(collection, name){
    var returnItem = _.find(collection, function(item) {
        return item.name === name
    });

    return returnItem;
};

module.exports = tasks;