/**
 * Created by TaekSoon on 8/28/14.
 */
var todoDB = {
    /*
     Data Structure

     [
       id : number
       todo_date : date
       todo : string
       nickname : string
       completed : bool
       create_date : date
     ]
    */

    CONST : {
        DB_NAME : "todolist",
        DB_VERSION : 1,
        DB_STORE_NAME : "todos"
    },

    db : null,

    returnValue : null,

    openDB : function() {
        console.log("opening db...");
        var req = window.indexedDB.open(this.CONST.DB_NAME, this.CONST.DB_VERSION);

        req.addEventListener("success", function(e) {
            this.db = e.target.result;
            console.log(this.db);
            console.log("opening DB accomplished.");
        }.bind(this));

        req.addEventListener("error", function(e) {
            console.log("open DB Error : ", e.target.errorCode);
        });

        req.addEventListener("upgradeneeded", function(e) {
            console.log("open DB upgradeneeded");
            var store = e.currentTarget.result.createObjectStore(
                this.CONST.DB_STORE_NAME, {keyPath : 'id', autoIncrement:true}
            );

            store.createIndex('nickname', 'nickname', {unique : true});
            store.createIndex('todo_date', 'todo_date', {unique : false});
            store.createIndex('completed', 'completed', {unique : false});

            console.log("upgrade accomplished");
        }.bind(this));
    },

    getObjectStore : function(storeName, nMode) {
        var transaction = this.db.transaction(storeName, nMode);
        transaction.addEventListener("complete", function(e) {
            console.log("getting transaction accomplished");
        });
        transaction.addEventListener("error", function(e){
            console.log("getting transaction error : ", e.target.errorCode);
        });

        return transaction.objectStore(storeName);
    },

    insert : function(oData) {
        console.log("trying to insert data..." + oData);

        var objectStore = this.getObjectStore(this.CONST.DB_STORE_NAME, "readwrite");
        var request = objectStore.add(oData);
        request.addEventListener("success", function(e) {
            console.log("insert accomplished. + ", e.target.result);
        });
    },

    findWithKey : function(key) {
        console.log("trying to find with key..." + key);

        var objectStore = this.getObjectStore(this.CONST.DB_STORE_NAME, "readonly");
        var request = objectStore.get(key);

        request.addEventListener("success", function(e) {
            console.log("Result for key (" + key + ") is : " + e.target.result);
            this.returnValue = e.target.result;
        }.bind(this));
    },

    findWithIndex : function(sIndex, sTargetIndex) {
        console.log("trying to find with index..." + sIndex);

        var objectStore = this.getObjectStore(this.CONST.DB_STORE_NAME, "readonly");
        var index = objectStore.index(sIndex);
        var request = index.get(sTargetIndex);
        request.addEventListener("success", function(e) {
            console.log("Result for index (" + sIndex + ") is : " + e.target.result);
            this.returnValue = e.target.result;
        }.bind(this));
    },

    deleteWithKey : function(key) {
        console.log("trying to find with key..." + key);

        var objectStore = this.getObjectStore(this.CONST.DB_STORE_NAME, "readwrite");
        var request = objectStore.delete(key);
        request.addEventListener("success", function(e) {
            console.log("data with key(" + key +") has been deleted. : " + e.target.result);
        });
    },

    update  : function(key, oChangeData) {
        console.log("trying to find with key..." + key);

        var objectStore = this.getObjectStore(this.CONST.DB_STORE_NAME, "readwrite");
        var request = objectStore.get(key);
        request.addEventListener("success", function(e) {
            var oData = e.target.result;
            for (var key in oChangeData) {
                oData[key] = oChangeData[key];
            }
            var requestUpdate = objectStore.put(oData);
            requestUpdate.addEventListener("success", function(e) {
                console.log("data updated! : " + oData);
            });
        });
    }
};