/*****************************LOGON(logon.js)*************************/

"use strict";

function Logon(logout) {
    if (typeof getCookie("id_user") !== "undefined") {
        //this.user = new User(getCookie("id_user"), "", "", "");
        this.user = new User($.cookie("id_user"), "", "", "");
        this.isAuthorised = true;
    }
    else {
        this.isAuthorised = false;
        this.user = null;
    }

    this.$root = null;
    this.$login = null;
    this.$logout = $(logout);
    this.$password = null;
    this.$elogin = null;
    this.$epassword = null;
    this.$eauth = null;

    this.cart = null;

    //this.$logout.off();

    this.render();
}

/**
 * Запрос идентификации и аутентификации на сервер
 */
Logon.prototype.signIn = function () {
    let login = this.$login.val();
    let password = this.$password.val();
    if (this.checkForm()) {
        $.post({
            url: settings.apiUrl + 'login.json',
            dataType: 'json',
            data: {
                'username': login,
                'password': password,

            },
            success: function (data) {
                if (data.result === 1) {
                    this.isAuthorised = true;
                    this.user = new User(data.user.id_user, data.user.user_login, data.user.user_name, data.user.user_lastname);
                    $.cookie("id_user", data.user.id_user);
                    this.render();
                    this.$eauth.text("");
                    if (this.cart!==null) cart.download(this.user.id_user);
                    window.location.href = "index.html";
                }
                else {
                    this.$eauth.text(data.errorMessage);
                }
                this.render();
            },
            context: this
        });

    }
};

/**
 * Обработчик нажатия на кнопку
 */
Logon.prototype.btnClick = function () {
    console.log(this);
    if (this.isAuthorised) {
        this.logout();
        //window.location.href = "index.html";
    }
    else {
        window.location.href = "login.html";
    }
};

/**
 * Запрос выхода из личного кабинета на сервер
 */
Logon.prototype.logout = function () {
    if (this.isAuthorised) {
        $.post({
            url: settings.apiUrl + 'logout.json',
            dataType: 'json',
            data: {
                'id_user': this.user.id
            },
            success: function (data) {
                if (data.result === 1) {
                    this.isAuthorised = false;
                    $.cookie("id_user", null);
                }
                else {
                    alert(data.errorMessage);
                }
                this.render();
            },
            context: this
        });
    }
};


/**
 * Проверить, заполнены ли элементы формы
 */
Logon.prototype.checkForm = function () {
    let ret = true;
    if (this.$login.val().length === 0) {
        this.$elogin.text("* значение почты не может быть пустым");
        ret = false;
    }
    if (this.$password.val().length === 0) {
        this.$epassword.text("* значение пароля не может быть пустым");
        ret = false;
    }
    if (ret) {
        this.$elogin.text("");
        this.$epassword.text("");
    }
    return ret;
};

Logon.prototype.render = function () {
    if (this.$logout !== null) {
        if (this.isAuthorised) {
            this.$logout.text('Logout');
        }
        else {
            this.$logout.text('Sign In');
        }
    }
};


/**
 * Класс - пользователь
 * @param id
 * @param login
 * @param name
 * @param lastname
 * @constructor
 */
function User(id, login, name, lastname) {
    this.id = id;
    this.login = login;
    this.name = name;
    this.lastname = lastname;
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

