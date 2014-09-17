function TODO(sUserName) {
    var USER_NAME = sUserName;

    var CONST_NUM = {
        ENTER_KEYCODE : 13
    };

    var sTemplate =
        "{{#param}}" +
        "<li {{complete}}  data-id='{{id}}' style='{{ liStyle }}'>" +
            "<div class='view'>" +
                "<input class='toggle' type='checkbox' {{checked}}>" +
                "<label>{{todo}}</label>" +
                "<button class='destroy'></button>" +
                "{{ #attached }}" +
                    "{{ #isImg }}" +
                        "<img class='attached-thumbnail'/>" +
                    "{{ /isImg }}" +
                    "<a href='#' class='attached-view'>{{attached.name}}</a>" +
                "{{ /attached}}" +
            "</div>" +
        "</li>" +
        "{{/param}}";

    var HISTORY_MANAGER = {
        init : function() {
            window.addEventListener('popstate', this.setPopstateStatus);
        },

        setPopstateStatus : function(e) {
            var nFilterName = e.state === null ? 'all' : e.state.nFilterName;

            FILTER.setFilter(nFilterName);
        }
    };

    var FILTER = {
        CONST_FILTER_ID : {
            all : 'filter-all',
            active : 'filter-active',
            completed : 'filter-completed'
        },

        init : function() {
            this.currentFilter = this.CONST_FILTER_ID.all;
            document.getElementById('filters').addEventListener('click', this.changeFilter.bind(this));

        },

        changeFilter : function(e) {
            e.preventDefault();

            var elTarget = e.target;
            var nTagName = elTarget.tagName;

            if (nTagName.toLowerCase() === 'a' && !elTarget.classList.contains('selected')) {
                var nFilterLocation = elTarget.getAttribute('href');
                var nFilterName = elTarget.text.toLowerCase();

                history.pushState({nFilterName : nFilterName}, null, nFilterLocation);
                this.setFilter(nFilterName);
            }
        },

        setFilter : function(nFilterName) {
            var elTargetFilter = document.getElementById('filter-' + nFilterName);
            this.changeFocus(elTargetFilter);

            var nFilterClassName = nFilterName === 'all' ? '' : 'all-' + nFilterName;
            document.getElementById('todo-list').className = nFilterClassName;
        },

        changeFocus : function(elTarget) {
            document.getElementById(this.currentFilter).classList.remove('selected');
            elTarget.classList.add('selected');
            this.currentFilter = elTarget.id;
        }
    };

    var INTERNET_CONNECTION = {
        init : function() {
            addEventListener("online", this.toggleOfflineClass);

            addEventListener("offline", this.toggleOfflineClass);
        },

        toggleOfflineClass : function() {
            document.getElementById('header').classList[navigator.onLine ? "remove" : "add"]('offline');
        }
    };

    var AJAX = {
        url : 'http://localhost:8080/todo/api/',
        sUserId : sUserName,

        /*
            param object
            {
                method      :   String,
                url         :   String,
                async       :   boolean,
                header      : {
                                key : value
                              },
                callback    : {
                                success : function (sRes),
                                fail    : function (sRes)
                              },
                methodParam       :   String
            }
        */
        call : function (param) {
            var xhr = new XMLHttpRequest();
            xhr.open(param.method, param.url, param.async);

            for (var key in param.header) {
                xhr.setRequestHeader(key, param.header[key]);
            }

            xhr.addEventListener("load",function(e) {
                if (this.status == 200) {
                    var sRes = xhr.responseText;
                    param.callback.success(sRes);
                } else {
                    param.callback.fail(sRes);
                }
            });
            xhr.send(param.methodParam);
        },

        saveTodo : function(elTarget) {
            var sTodo = elTarget.value;
            var dTodoDate = document.getElementById('todo-date').value;
            elTarget.value = "";
            this.call({
                method   : 'PUT',
                url      : this.url + this.sUserId,
                async    : true,
                header   : { 'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8'},
                callback : {
                    success : function(sRes) {
                        var oResponse = JSON.parse(sRes);
                        var nInsertId = oResponse.id;
                        console.log("saved");
                        todoDB.update(nInsertId, function(oData) {
                            oData.synced = true;
                        });
                    },

                    fail    : function(sRes) {
                        console.log("fail");
                    }
                },
                methodParam : "todo=" + sTodo + "&todoDate=" + dTodoDate
            });
        },

        toggleCompleteTodo : function(elTarget) {
            var liTodo = elTarget.parentNode.parentNode;
            var nTodoId = liTodo.dataset.id;
            // -> completed
            var nComplete = 1;
            // -> not completed
            if (liTodo.classList.contains('completed')) {
                nComplete = 0;
            }

            this.call({
                method  : 'POST',
                url     : this.url + this.sUserId + '/' + nTodoId,
                async   : true,
                header  : { 'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8' },
                callback : {
                    success : function(sRes) {
                        DOM_MUTAION.toggleComplete(elTarget);
                        console.log("complete");
                    },

                    fail : function(sRes) {
                        console.log("fail");
                    }
                },
                methodParam : "completed=" + nComplete
            });
        },

        deleteTodo : function(elTarget) {
            var liTodo = elTarget.parentNode.parentNode;
            var nTodoId = liTodo.dataset.id;

            this.call({
                method   : 'DELETE',
                url      : this.url + this.sUserId + '/' + nTodoId,
                async    : true,
                header   : { 'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8' },
                callback : {
                    success : function(sRes) {
                        DOM_MUTAION.removeTodo(liTodo);
                        console.log("remove");
                    },

                    fail : function(sRes) {
                        console.log("fail");
                    }
                }
            });
        },

        loadAllTodos : function() {
            var dTodoDate = document.getElementById('todo-date').value;
            this.call({
                method   : 'GET',
                url      : this.url + this.sUserId + "?todoDate=" + dTodoDate,
                async    : true,
                header   : { 'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8' },
                callback : {
                    success : function(sRes) {
                        var aTodos = JSON.parse(sRes);
                        DOM_MUTAION.addAllNewTodo(aTodos);
                    },

                    fail : function(sRes) {
                        console.log("fail");
                    }
                }
            });
        }
    };

    // Animation 관련 함수를 모아놓은 객체
    var ANIMATION = {
        fadeOut : function (elTarget) {
            elTarget.style.webkitAnimation = "fadeOut 500ms";
        },

        fadeIn : function (elTarget) {
            elTarget.style.webkitAnimation = "fadeIn 500ms";
        }
    };

    // DOM 조작을 위한 함수를 모아놓은 객체
    var DOM_MUTAION = {
        addAllNewTodo : function(aTodos) {
            aTodos.map(function(oItem) {
                // prework for using this object in template
                if (oItem.completed === true) {
                    oItem.complete = 'class=completed';
                    oItem.checked = 'checked';
                }
            });

            aTodos.sort(function(oA, oB) {
                var dateA = new Date(oA.date);
                var dateB = new Date(oB.date);

                if (dateA > dateB) {
                    return 1;
                } else if (dateA < dateB) {
                    return -1;
                } else {
                    return 0;
                }
            });
            var sResultDom = DOM_MUTAION.createNewTodoString(aTodos);

            document.getElementById('todo-list').insertAdjacentHTML('beforeend', sResultDom);
        },
        createNewTodoString : function (aParam) {
            return Mustache.render(sTemplate, { param : aParam});
        },

        addNewTodo : function (nId, sTodo, attached) {
            var sDom = DOM_MUTAION.createNewTodoString([{
                                                         id : nId,
                                                         todo : sTodo,
                                                         liStyle : 'opacity : 0',
                                                         attached : attached
                                                      }]);

            document.getElementById("todo-list").insertAdjacentHTML("beforeend", sDom);
            var elAdded = document.getElementById("todo-list").lastChild;

            elAdded.addEventListener("webkitAnimationEnd", function some(e) {
                elAdded.removeEventListener("webkitAnimationEnd", some);
                elAdded.style.opacity = 1;
            });

            ANIMATION.fadeIn(elAdded);
        },

        removeTodo : function (liTodo) {
            var ulParent = liTodo.parentNode;
            liTodo.addEventListener("webkitAnimationEnd", function some(e) {
                liTodo.removeEventListener("webkitAnimationEnd", some);
                ulParent.removeChild(liTodo);
            });

            ANIMATION.fadeOut(liTodo);
        },

        toggleComplete : function (elTarget) {
            elTarget.parentNode.parentNode.classList.toggle("completed");
        },

        removeAllTodo : function() {
            document.getElementById('todo-list').innerHTML = "";
        }
    };

    var UTIL = {
        setToday : function() {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();

            if(dd < 10) {
                dd = '0' + dd
            }

            if(mm < 10) {
                mm = '0' + mm
            }

            today = yyyy + '-' + mm + '-' + dd;

            document.getElementById('todo-date').value = today;
        },
        getFileNameForView : function(sFileName) {
            var nLimit = 80;
            if (sFileName.length > nLimit) {
                sFileName = sFileName.substr(0, nLimit) + '...';
            }

            return sFileName;
        }
    }

    var CONTROLLER = {
        /*
         Data Structure

         [
         id : number
         todo_date : date
         todo : string
         nickname : string
         completed : bool
         create_date : date
         synced : bool,
         (if exist) attached : sFileName
         ]
       */
        addTodo : function(elTarget) {
            var sTodo = elTarget.value;
            elTarget.value = "";
            var dTodoDate = document.getElementById('todo-date').value;
            var attached = document.getElementById('attached').files[0];

            var oData = {
                todo_date : dTodoDate,
                todo : sTodo,
                nickname : USER_NAME,
                completed : false,
                create_date : dTodoDate,
                synced : false,
                attached : attached
            };

            if (attached.type.match(/image.*/)) {
                oData.isImg = true;
            }

            todoDB.insert(oData, function(nId) {
                DOM_MUTAION.addNewTodo(nId, sTodo, attached);
            });
            if (navigator.onLine) {
                AJAX.saveTodo(elTarget);
            }

            document.getElementById('attached').value = '';
        },

        loadAllTodos : function() {
            var dDate = document.getElementById('todo-date').value;
            // for testing (online <-> offline)
            if (!navigator.onLine) {
                AJAX.loadAllTodos();
            } else {
                todoDB.findAllWithIndex('todo_date', dDate, function(aData) {
                    DOM_MUTAION.addAllNewTodo(aData);
                });
            }
        },

        toggleCompleteTodo : function(elTarget) {
            var liTodo = elTarget.parentNode.parentNode;
            // When getting value from attribute, it is string
            var nId = parseInt(liTodo.dataset.id, 10);
            var bCompleted = liTodo.classList.contains('completed') ? false : true;
            DOM_MUTAION.toggleComplete(elTarget);
            todoDB.update(nId, function(oData) {
                oData.completed = bCompleted;
            });
            if (navigator.onLine) {
                AJAX.toggleCompleteTodo(elTarget);
            }
        },

        deleteTodo : function(elTarget) {
            var liTodo = elTarget.parentNode.parentNode;
            var nId = parseInt(liTodo.dataset.id, 10);

            todoDB.deleteWithKey(nId);
            // if an item has been deleted from indexedDB,
            // how to sync it with server?
            if (navigator.onLine) {
                AJAX.deleteTodo(elTarget);
            }
            DOM_MUTAION.removeTodo(liTodo);
        }
    };

    // 초기화 함수
    this.init = function() {
        document.addEventListener("DOMContentLoaded", function() {
            UTIL.setToday();
            todoDB.openDB(function() {
                CONTROLLER.loadAllTodos();
            });
            INTERNET_CONNECTION.init();
            FILTER.init();
            HISTORY_MANAGER.init();

            document.getElementById("new-todo").addEventListener("keydown", function(e) {
                if (e.keyCode === CONST_NUM.ENTER_KEYCODE) {
                    CONTROLLER.addTodo(e.target);
                }
            });

            document.getElementById("todo-list").addEventListener("click", function(e) {
                var elTarget = e.target;
                var aClassList = elTarget.classList;
                if (aClassList.contains("toggle")) {
                    CONTROLLER.toggleCompleteTodo(elTarget);
                } else if (aClassList.contains("destroy")) {
                    CONTROLLER.deleteTodo(elTarget);
                }
            });

            document.getElementById('todo-date').addEventListener("change", function(e) {
                DOM_MUTAION.removeAllTodo();
                // for testing
                CONTROLLER.loadAllTodos();
            });
        });
    };
}