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
                    let page = this.resultToObjects(data.products);
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
    this.removeProductFromServerCart();
    this.cart.removeProductRowFromCart($div, this);
};

/**
 * Оповестить сервер об удалении товара из корзины
 * @param cartProduct {CartProduct}
 */
CartProduct.prototype.removeProductFromServerCart = function () {
    if (this.id_user !== null) {
        $.post({
            url: settings.apiUrl + 'deleteFromBasket.json',
            dataType: 'json',
            data: {
                "id_user": this.cart.id_user,
                "id_product": this.id
            },
            success: function (data) {

            },
            context: this
        });
    }
};

/*******************************************************************************/

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

