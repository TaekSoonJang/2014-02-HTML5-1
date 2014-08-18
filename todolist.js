function TODO(sUserName) {

    var CONST_NUM = {
        ENTER_KEYCODE : 13
    };

    var sTemplate =
        "{{#param}}" +
        "<li {{complete}}  data-id='{{id}}' {{style}}>" +
            "<div class='view'>" +
                "<input class='toggle' type='checkbox' {{checked}}>" +
                "<label>{{todo}}</label>" +
                "<button class='destroy'></button>" +
            "</div>" +
        "</li>" +
        "{{/param}}";

    // FILTER 기능 외에도 히스토리를 관리할 일이 있을지도 몰라서 히스토리 객체를 따로 빼놨습니다.
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
            elTarget.value = "";
            this.call({
                method   : 'PUT',
                url      : 'http://ui.nhnnext.org:3333/' + this.sUserId,
                async    : true,
                header   : { 'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8'},
                callback : {
                    success : function(sRes) {
                        var oResponse = JSON.parse(sRes);
                        var nInsertId = oResponse.insertId;
                        console.log("saved");
                        DOM_MUTAION.addNewTodo(nInsertId, sTodo);
                    },

                    fail    : function(sRes) {
                        console.log("fail");
                    }
                },
                methodParam : "todo=" + sTodo
            });
        },

        completeTodo : function(elTarget) {
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
                url     : 'http://ui.nhnnext.org:3333/' + this.sUserId + '/' + nTodoId,
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
                url      : 'http://ui.nhnnext.org:3333/' + this.sUserId + '/' + nTodoId,
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
            this.call({
                method   : 'GET',
                url      : 'http://ui.nhnnext.org:3333/' + this.sUserId,
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
            console.log(aTodos);
            aTodos.map(function(oItem) {
                if (oItem.completed === 1) {
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

        addNewTodo : function (nId, sTodo) {
            var sDom = DOM_MUTAION.createNewTodoString([{id : nId, todo : sTodo, style : 'style = "opacity : 0"'}]);

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
        }
    };

    // 초기화 함수
    this.init = function() {
        document.addEventListener("DOMContentLoaded", function () {
            AJAX.loadAllTodos();
            INTERNET_CONNECTION.init();
            FILTER.init();
            HISTORY_MANAGER.init();

            document.getElementById("new-todo").addEventListener("keydown", function (e) {
                if (e.keyCode === CONST_NUM.ENTER_KEYCODE) {
                    AJAX.saveTodo(e.target);
                }
            });

            document.getElementById("todo-list").addEventListener("click", function(e) {
                var elTarget = e.target;
                var aClassList = elTarget.classList;
                if (aClassList.contains("toggle")) {
                    AJAX.completeTodo(elTarget);
                } else if (aClassList.contains("destroy")) {
                    AJAX.deleteTodo(elTarget);
                }
            });
        });
    };
}