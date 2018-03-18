let settings = {
    apiUrl: "/!myShop/dist/api/"
};
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


/*****************************CATALOG(catalog.js)*************************/
"use strict";

function Catalog($parent) {
    this.pages = [];
    this.$parent = $($parent);
    this.download({page_number: 1, id_category: 1});
}

/**
 * Загружает страницу, если она не загружена
 * @param request_data {{page_number, id_category}}
 */
Catalog.prototype.download = function (request_data) {
    let page = this.isDownloaded(request_data);
    if (page === null) {
        $.post({
            url: settings.apiUrl + 'catalogData.json',
            dataType: 'json',
            data: request_data,
            success: function (data) {
                if (data.result === 1) {
                    page = this.resultToObjects(request_data, data);
                    this.init(page);
                }
                else {
                    alert(data.errorMessage);
                }
            },
            context: this
        });
    }
    else {
        this.init(page);
    }
};

/**
 * Проверяет, загружена ли уже страница, если загружена возвращает ее. Если нет, возвращает Null
 * @returns {Page} Если страница загружена возвращает ее. Если нет, возвращает Null
 * @param request_data {{page_number, id_category}}
 */
Catalog.prototype.isDownloaded = function (request_data) {
    for (let page of this.pages) {
        if (page.page_number === request_data.page_number
            && page.id_category === request_data.id_category) return page;
    }
    return null;
};

/**
 * Разобрать данные с сервера и преобразовать в объекты необходимого типа
 * @param data {{result,page_number,total_pages,[]products,errorMessage}}
 * @param request_data {{page_number, id_category}}
 * @returns {Page}
 */
Catalog.prototype.resultToObjects = function (request_data, data) {
    let new_element = new Page(data, request_data.id_category);
    this.pages.push(new_element);
    return new_element;
};

/**
 * Формирует страницу каталога на основе имеющейся в памяти информации.
 * Если там null, ничего не делает
 * @param page {Page}
 */
Catalog.prototype.init = function (page) {
    this.$parent.empty();
    page.init(this.$parent);
};

/**************************************************************************/
/**
 * Содержит страницу каталога с товарами
 * @param obj {{result,page_number,total_pages,[]products,errorMessage}}
 * @param id_category {int}
 * @constructor
 */
function Page(obj, id_category) {
    this.$parent = null;
    this.page_number = obj.page_number;
    this.id_category = id_category;
    this.products = [];
    let newProduct = null;

    for (let product of obj.products) {
        newProduct = new Product(product);
        this.products.push(newProduct);
    }
}

Page.prototype.init = function ($parent) {
    this.$parent = $($parent);

    //this.$parent.empty();
    for (let product of this.products) {
        product.init(this.$parent);
    }
};


/**************************************************************************/


/**
 * Класс - реализующий картинку-ссылку в верхнем выпадающем меню
 * @param $parent
 * @param obj {{id, name, product_page_URL, price,currency,img_URL,img_alt}}
 * @constructor
 */
function Product(obj) {
    this.$parent = null;

    this.id = obj.id;
    this.name = obj.name;
    this.product_page_URL = obj.product_page_URL;
    this.price = obj.price;
    this.currency = obj.currency;
    this.img_URL = obj.img_URL;
    this.img_alt = obj.img_alt;
}

Product.prototype.SVG = String('<svg class="BasketSvgWhite" version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"\n' +
    '                         viewBox="0 0 32 29" style="enable-background:new 0 0 32 29;" xml:space="preserve" width="32" height="29">\n' +
    '                        <g>\n' +
    '                            <g>\n' +
    '                                <line class="st0" x1="5.3" y1="1" x2="1.3" y2="1"></line>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <line class="st0" x1="5.3" y1="1" x2="10.6" y2="19.4"></line>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <line class="st0" x1="14.1" y1="6.9" x2="30.8" y2="7"></line>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <line class="st0" x1="25.3" y1="19.4" x2="30.8" y2="7"></line>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <line class="st0" x1="10.6" y1="19.4" x2="25.3" y2="19.4"></line>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <circle class="st1" cx="9.4" cy="26.2" r="1.6"></circle>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <circle class="st1" cx="26.1" cy="26.2" r="1.6"></circle>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <circle class="st2" cx="9.5" cy="26.2" r="0.8"></circle>\n' +
    '                            </g>\n' +
    '                            <g>\n' +
    '                                <circle class="st2" cx="26.1" cy="26.2" r="0.8"></circle>\n' +
    '                            </g>\n' +
    '                        </g>\n' +
    '                    </svg>');

/**
 * Создать HTML элемент и присоединить в меню
 */
Product.prototype.init = function ($parent) {
    this.$parent = $($parent);

    let $article = $('<article />', {class: "Product"});
    this.$parent.append($article);

    let $a = $('<a />', {
        class: "Product__Link",
        href: this.product_page_URL
    });
    $article.append($a);

    //раздел с фото
    let $photo = $('<div />', {class: "Product__Photo"});
    $a.append($photo);

    let $img = $('<img />', {
        class: "Product__Image",
        "src": this.img_URL,
        "alt": this.img_alt
    });
    $photo.append($img);

    let $btn = $('<div />', {class: "Product__AddBtn"});
    $photo.append($btn);

    $btn.append(this.SVG + "Add to Cart");

    //раздел Info
    let $info = $('<div />', {class: "Product__Info"});
    $a.append($info);

    let $h2 = $('<h2 />', {class: "Product__Name"});
    $h2.text(this.name);
    $info.append($h2);

    let $span = $('<span />', {class: "Product__Price Color_pink"});
    let price = this.currency === "$" ? this.currency + this.price : this.price + " " + this.currency;
    $span.text(price);
    $info.append($span);
};


var slider=1;
/*****************************BASKET(basket.js)*************************/
"use strict";

function Cart($parent, id_user, $basketOnTop) {
    this.id_user = id_user;
    this.products = [];
    this.$parent = $($parent);
    this.$basketOnTop = $($basketOnTop);
    this.download(id_user);

    $("#ClearCart").on('click', () => {
        this.clearFullCart();
    });
}

/**
 * Загружает корзину, если пользователь залогинен
 * @param id_user {int}
 */
Cart.prototype.download = function (id_user) {
    if (id_user !== null) {
        $.post({
            url: settings.apiUrl + 'getBasket.json',
            dataType: 'json',
            data: {id_user},
            success: function (data) {
                if (data.result === 1) {
                    page = this.resultToObjects(data.products);
                    this.init();
                }
                else {
                    alert(data.errorMessage);
                }
            },
            context: this
        });
    }
};

/**
 *
 * @param data {{id,name,product_page_URL,price,currency,img_URL,img_alt,quantity,shipping_price,rating,characteristics}}
 */
Cart.prototype.resultToObjects = function (data) {
    let newProduct = null;
    for (let product of data) {
        newProduct = new CartProduct(this, product);
        this.products.push(newProduct);
    }
};


Cart.prototype.init = function () {
    if (this.$parent !== null) {
        //this.$parent.empty();
        this.$parent.find(".RowProduct").remove();

        for (let product of this.products) {
            product.initCartRow(this.$parent);
        }
        //двигаем кнопку заказа. она position absolute, т.к. является частью формы, но отображается снаружт формы
        this.$parent.find(".Checkout").css("top", "" + (this.products.length * 162 + 326) + "px")
    }
    if (this.$cartOnTop != null) {

    }
};

/**
 * Удалить продукт из корзины в строчном представлении (запускаяется кнопкой обработчиком удаления)
 * @param $div
 * @param product {CartProduct}
 */
Cart.prototype.removeProductRowFromCart = function ($div, product) {
    this.products.splice(this.products.indexOf(product), 1);
    $div.remove();
    this.$parent.find(".Checkout").css("top", "" + ((this.products.length) * 162 + 326) + "px");
};

Cart.prototype.clearFullCart = function () {
    this.products = [];
    this.$parent.find(".RowProduct").remove();
    this.$parent.find(".Checkout").css("top", "" + ((this.products.length) * 162 + 326) + "px");
};

/*********************************************************************************/

/**
 *
 * @param cart {Cart}
 * @param obj {{id,name,product_page_URL,price,currency,img_URL,img_alt,quantity,shipping_price,rating,characteristics}}
 * @constructor
 */
function CartProduct(cart, obj) {
    Product.call(this, obj);
    this.quantity = obj.quantity;
    this.shipping_price = obj.shipping_price;
    this.rating = obj.rating;
    this.characteristics = [];

    this.cart = cart;

    this.full_price = this.price * this.quantity + this.shipping_price;

    let newCharacteristic = null;

    for (let characteristic of obj.characteristics) {
        newCharacteristic = new Characteristic(characteristic);
        this.characteristics.push(newCharacteristic);
    }
}

CartProduct.prototype = Object.create(Product.prototype);
CartProduct.prototype.constructor = CartProduct;

CartProduct.prototype.initCartRow = function ($parent) {
    this.$parent = $($parent);

    let $div = $('<div />', {class: "RowProduct"});
    this.$parent.append($div);

    //Detail
    let $divDetail = $('<div />', {class: "Detail"});
    $div.append($divDetail);
    let $divDetailA = $('<a />', {"href": this.product_page_URL});
    $divDetail.append($divDetailA);
    let $divDetailALeft = $('<div />', {class: "Left"});
    $divDetailA.append($divDetailALeft);
    let $divDetailALeftImg = $('<img />', {
        class: "ProductImg",
        "src": this.img_URL,
        "alt": this.img_alt
    });
    $divDetailALeft.append($divDetailALeftImg);

    let $divDetailARight = $('<div />', {class: "Right"});
    $divDetailA.append($divDetailARight);
    let $divDetailARightH3 = $('<h3 />', {});
    $divDetailARightH3.text(this.name);
    $divDetailARight.append($divDetailARightH3);
    for (let characteristic of this.characteristics) {
        characteristic.init($divDetailARight);
    }

    //UnitPrice
    let $divUnitPrice = $('<div />', {class: "UnitPrice"});
    $div.append($divUnitPrice);
    let $divUnitPriceP = $('<p />', {class: "Value"});
    let price = this.currency === "$" ? this.currency + this.price : this.price + " " + this.currency;
    $divUnitPriceP.text(price);
    $divUnitPrice.append($divUnitPriceP);

    //Quantity
    let $divQuantity = $('<div />', {class: "Quantity"});
    $div.append($divQuantity);
    let $divQuantityInput = $('<input />', {
        "type": "text",
        "pattern": "[0-9]*",
        "title": "количество товара должно быть цифрой",
        "value": this.quantity
    });
    $divQuantity.append($divQuantityInput);

    //Shipping
    let $divShipping = $('<div />', {class: "Shipping"});
    $div.append($divShipping);
    let $divShippingP = $('<p />', {class: "Value"});
    price = this.currency === "$" ? this.currency + this.price : this.price + " " + this.currency;
    price = this.price === 0 ? "FREE" : price;
    $divShippingP.text(price);
    $divShipping.append($divShippingP);

    //Price
    let $divPrice = $('<div />', {class: "Price"});
    $div.append($divPrice);
    let $divPriceP = $('<p />', {class: "Value"});
    price = this.currency === "$" ? this.currency + this.full_price : this.full_price + " " + this.currency;
    $divPriceP.text(price);
    $divPrice.append($divPriceP);

    //Action
    let $divAction = $('<div />', {class: "Action"});
    $div.append($divAction);
    let $divActionButton = $('<div />', {class: "ClearBtn fas fa-times-circle"});
    $divAction.append($divActionButton);


    //Навешиваем все обработчики
    $divQuantityInput.on('input', () => {
        this.changeProductCount($divQuantityInput, $divPriceP);
    });

    $divActionButton.on('click', () => {
        this.removeProductRowFromCart($div);
    });
};

/**
 * Пересчитать количество товаров в страничном представлении корзины
 * @param $divQuantityInput
 * @param $divPriceP
 */
CartProduct.prototype.changeProductCount = function ($divQuantityInput, $divPriceP) {
    let newVal = +$divQuantityInput.val();
    if (newVal >= 0) {
        this.quantity = newVal;
        this.full_price = this.price * this.quantity + this.shipping_price;
        let price = this.currency === "$" ? this.currency + this.full_price : this.full_price + " " + this.currency;
        $divPriceP.text(price);
    }
    else if (isNaN(newVal)) {
        $divQuantityInput.val("1");
        $divPriceP.text("1");
    }
};

/**
 * Удалить продукт из корзины (обработчик кнопки в строчном представлении)
 * @param $div
 */
CartProduct.prototype.removeProductRowFromCart = function ($div) {
    this.cart.removeProductRowFromCart($div, this);
};

/**
 *
 * @param obj {{name,value}}
 * @constructor
 */
function Characteristic(obj) {
    this.name = obj.name;
    this.value = obj.value;
}

Characteristic.prototype.init = function ($parent) {
    this.$parent = $($parent);

    let $div = $('<div />', {class: "Parameter"});
    this.$parent.append($div);

    let $name = $('<p />', {class: "Name"});
    $name.text(this.name);
    $div.append($name);

    let $value = $('<p />', {class: "Value"});
    $value.text(this.value);
    $div.append($value);

};
/*****************************TOP MENU (menu.js)*************************/

function MenuTop($parent) {
    this.products = [];
    this.$parent = $($parent);
    this.download();
}

MenuTop.prototype.download = function () {
    $.post({
        url: settings.apiUrl + 'menu.json',
        dataType: 'json',
        data: {},
        success: function (data) {
            if (data.result === 1) {
                this.resultToObjects(data);
                this.init();
            }
            else {
                alert(data.errorMessage);
            }
        },
        context: this
    });

};

/**
 * Разобрать данные с сервера и преобразовать в объекты необходимого типа
 * @param data {result,[]elements,errorMessage}
 * @returns {*}
 */
MenuTop.prototype.resultToObjects = function (data) {
    let new_element = null;

    if (data.hasOwnProperty("products")) {
        for (let i in data.products) {
            new_element = new MenuTopElement(data.products[i]);
            this.products.push(new_element);
        }
    }
};

/**
 * Формирует верхнее меню на основе данных в переменной объекта content.
 * Если там null, ничего не делает
 */
MenuTop.prototype.init = function () {

    this.$parent.empty();

    let $ul= $('<ul />', {});
    this.$parent.append($ul);

    for (let elem of this.products) {
        elem.init($ul);
    }

};

/************************************************************************************/

/**
 * Класс - реализующий один элемент в верхнем меню
 * @param obj {{visible_name,href,drop_down_menu}}
 * @constructor
 */
function MenuTopElement(obj) {
    this.$parent = null;
    this.name = obj.visible_name;
    this.href = obj.href;
    this.products = [];
    this.$elements = null;

    let new_element = null;

    for (let i in obj.drop_down_menu) {
        new_element = new MenuTopElementColumn(obj.drop_down_menu[i]);
        this.products.push(new_element);
    }
}

MenuTopElement.prototype.init = function ($parent) {
    let new_element = null;
    this.$parent = $($parent);

    //добавляем элементы на страницу
    let $li = $('<li />');
    this.$parent.append($li);

    let $a = $('<a />', {"href": this.href});
    $a.text(this.name);
    $li.append($a);
    let $triangle = $('<div />', {class: "Square10"});
    $li.append($triangle);
    this.$elements = $('<div />', {class: "DropDownMenu Row Swing-in-top-fwd"});
    $li.append(this.$elements);

    for (let elem of this.products) {
        elem.init(this.$elements);
    }
};

/************************************************************************************/

/**
 * Класс - реализующий столбец в верхнем выпадающем меню
 * @param obj {{column_index,column_elements}}
 * @constructor
 */
function MenuTopElementColumn(obj) {
    this.$parent = null;
    this.index = obj.column_index;
    this.products = [];
    this.$elements = null;

    let new_element = null;

    for (let i in obj.column_elements) {
        if (obj.column_elements[i].hasOwnProperty("src")) {
            new_element = new MenuTopElementColumnPicture(obj.column_elements[i]);
        }
        else {
            new_element = new MenuTopElementColumnPart(obj.column_elements[i]);
        }
        this.products.push(new_element);
    }
}

MenuTopElementColumn.prototype.init = function ($parent) {
    let new_element = null;
    this.$parent = $($parent);

    //добавляем элементы на страницу
    this.$elements = $('<div />', {class: "Column"});
    for (let elem of this.products) {
        elem.init(this.$elements);
    }
    this.$parent.append(this.$elements);
};

/************************************************************************************/

/**
 * Класс - реализующий отдельную именованную часть столбца в верхнем выпадающем меню
 * @param obj
 * @constructor
 */
function MenuTopElementColumnPart(obj) {
    this.$parent = null;
    this.name = obj.part_name;
    this.products = [];
    this.$name = null;
    this.$elements = null;

    let new_element = null;

    for (let i in obj.part_elements) {
        if (obj.part_elements[i].hasOwnProperty("name")) {
            new_element = new MenuTopElementColumnPartLink(obj.part_elements[i]);
            this.products.push(new_element);
        }
    }
}

/**
 * Добавляет часть меню в переданный в параметре столбец
 * @param $parent
 */
MenuTopElementColumnPart.prototype.init = function ($parent) {
    let new_element = null;
    this.$parent = $($parent);

    //добавляем имя
    this.$name = $('<h4 />', {});
    this.$name.text(this.name);
    this.$parent.append(this.$name);

    //добавляем ссылки
    this.$elements = $('<ul />', {});
    for (let elem of this.products) {
        elem.init(this.$elements);
    }
    this.$parent.append(this.$elements);

};

/************************************************************************************/

/**
 * Класс - реализующий элемент-ссылку в верхнем выпадающем меню
 * @param $parent
 * @param obj
 * @constructor
 */
function MenuTopElementColumnPartLink(obj) {
    this.$parent = null;
    this.name = obj.name;
    this.href = obj.href;
    this.$html = $('<li />', {});
}

/**
 * Создать HTML элемент и присоединить в меню
 */
MenuTopElementColumnPartLink.prototype.init = function ($parent) {
    this.$parent = $($parent);
    this.$html.append('<a href="' + this.href + '">' + this.name + '</a>');
    this.$parent.append(this.$html);
};

MenuTopElementColumnPartLink.prototype.render = function () {
    this.$html.find("a").attr("href", this.href);
    this.$html.find("a").text(this.name);
};

/************************************************************************************/

/**
 * Класс - реализующий картинку-ссылку в верхнем выпадающем меню
 * @param $parent
 * @param obj
 * @constructor
 */
function MenuTopElementColumnPicture(obj) {
    this.$parent = null;
    this.src = obj.src;
    this.alt = obj.alt;
    this.href = obj.href;
    this.text = obj.text;
    this.$html = $('<div />', {class: "Banner"});
}

/**
 * Создать HTML элемент и присоединить в меню
 */
MenuTopElementColumnPicture.prototype.init = function ($parent) {
    this.$parent = $($parent);
    let $link = $('<a />', {href: this.href});
    $(this.$html).append($link);

    let $div = $('<div />', {});
    $div.append("<span>" + this.text + "</span>");
    let $img = $('<img />', {
        "src": this.src,
        "alt": this.alt
    });
    $link.append($div);
    $link.append($img);

    $(this.$parent).append(this.$html);
};
