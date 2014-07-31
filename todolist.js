var ADD_NEW_TODO = (function() {
    var CONST_NUM = {
        ENTER_KEYCODE : 13
    };

    /*
     ???????????????????????????????????????????????????
     새로 삽입하는 DOM에 fadeIn 애니메이션을 집어넣으려고 일부러
     inline script로 opacity 속성을 0으로 줬는데 이렇게 하는 것 말고는 방법이 없을까요?
     ???????????????????????????????????????????????????
     */

    var sTemplate =
        "<li style='opacity : 0'>" +
            "<div class='view'>" +
                "<input class='toggle' type='checkbox'>" +
                "<label>{{todo}}</label>" +
                "<button class='destroy'></button>" +
            "</div>" +
        "</li>";

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
        createNewTodoString : function (sTodo) {
            return Mustache.render(sTemplate, {todo : sTodo});
        },

        addNewTodo : function (elTarget) {
            var sTodo = elTarget.value;
            elTarget.value = "";

            var sDom = DOM_MUTAION.createNewTodoString(sTodo);

            document.getElementById("todo-list").insertAdjacentHTML("beforeend", sDom);
            var elAdded = document.getElementById("todo-list").lastChild;

            elAdded.addEventListener("webkitAnimationEnd", function some(e) {
                elAdded.removeEventListener("webkitAnimationEnd", some);
                elAdded.style.opacity = 1;
            });

            ANIMATION.fadeIn(elAdded);
        },

        removeTodo : function (elTarget) {
            var elParent = elTarget.parentNode;
            elTarget.addEventListener("webkitAnimationEnd", function some(e) {
                elTarget.removeEventListener("webkitAnimationEnd", some);
                elParent.removeChild(elTarget);
            });

            ANIMATION.fadeOut(elTarget);
        },

        toggleComplete : function (elTarget) {
            elTarget.parentNode.parentNode.classList.toggle("completed");
        }
    };

    // 초기화 함수
    document.addEventListener("DOMContentLoaded", function () {
        document.getElementById("new-todo").addEventListener("keydown", function (e) {
            if (e.keyCode === CONST_NUM.ENTER_KEYCODE) {
                DOM_MUTAION.addNewTodo(e.target);
            }
        });

        document.getElementById("todo-list").addEventListener("click", function(e) {
            var elTarget = e.target;
            var aClassList = elTarget.classList;
            if (aClassList.contains("toggle")) {
                DOM_MUTAION.toggleComplete(elTarget);
            } else if (aClassList.contains("destroy")) {
                DOM_MUTAION.removeTodo(e.target.parentNode.parentNode);
            }
        });
    });
})();