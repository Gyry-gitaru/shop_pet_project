const store = {
    user: {},
    products: [],
    cart: [],
    history: []
};
const setUser = (newUser) => {
    store.user = newUser;
    store.cart = newUser.shoppingCart;
    store.history = newUser.orders;
};
const setProductsList = (productsList) => {
    store.products = productsList;
};
const getProductsList = () => store.products;
const getUser = () => store.user;
const getShoppingCart = () => store.cart;
const getOrder = () => store.history;
const API = async (path, method = 'GET', obj) => {
    const API_URL = 'https://634e9f834af5fdff3a625f84.mockapi.io';

    let options = {
        method: method,
        headers: {
            "Content-type": "application/json"
        }
    }

    if (obj) options.body = JSON.stringify(obj);

    const url = `${API_URL}/${path}`;
    let request = await fetch(url, options);
    let response = request.ok ? request.json() : Promise.catch(request.statusText);

    return response;
};
const getUserFromAPI = async (email) => {
    const allUsers = await API('users');
    return allUsers.find(user => user.email === email);
};

const data = {
    loginUser: async (email, password, errorContainer) => {
        const user = await getUserFromAPI(email);
        if (!user) {
            errorContainer.textContent = 'Invalid email address';
            errorContainer.classList.add("active");
        } else if (user.password !== password) {
            errorContainer.textContent = 'Invalid password';
            errorContainer.classList.add("active");
        } else {
            const id = user.id;
            await API(`users/${id}`, `PUT`, {
                status: true
            });
            localStorage.setItem(`UserItem`, JSON.stringify(user));
            document.location.replace("index.html");
        }
    },
    registrationUser: async (name, email, password, passwordVerify, errorContainer) => {
        const user = await getUserFromAPI(email);
        if (user) {
            errorContainer.textContent = `User with email ${email} already exist!`;
            errorContainer.classList.add('active')
        } else if (password !== passwordVerify) {
            errorContainer.textContent = 'Password not matches!';
            errorContainer.classList.add('active')
        } else {
            const newUser = {
                name: name,
                email: email,
                password: password,
                status: true
            }
            await API('users', `POST`, newUser);
            localStorage.setItem(`UserItem`, JSON.stringify(newUser));
            document.location.replace("index.html");
        }
    },
    getUserFromLS: async () => {
        const user = JSON.parse(localStorage.getItem(`UserItem`));
        if (user !== null) {
            const allUsers = await API('users');
            const foundUser = allUsers.find(item => item.email === user.email);
            setUser(foundUser);
        };
    },
    getAllProductsList: async () => {
        const productsList = await API('products');
        setProductsList(productsList);
    },
    changeProductInShoppingCart: async (shoppingCart) => {
        try {
            const user = getUser();
            const userData = await API(`users/${user.id}`, `PUT`, {
                shoppingCart
            });
            setUser(userData);
            localStorage.setItem(`UserItem`, JSON.stringify(userData));
        } catch (e) {
            console.error(e);
        }
    },
    userLogOut: async (id) => {
        await API(`users/${id}`, `PUT`, {
            status: false
        });
        localStorage.clear();
        document.location.replace("index.html");
    },
    changeCountValue: async (id, qty, totalPrice) => {
        const cart = getShoppingCart();
        const updatedCart = cart.map((item) => {
            if (item.id === id) {
                item.count = qty;
                item.totalPrice = totalPrice;
            }
            return item;
        })
        const user = getUser();
        const userData = await API(`users/${user.id}`, `PUT`, {
            shoppingCart: updatedCart
        });
        setUser(userData);
        localStorage.setItem(`UserItem`, JSON.stringify(userData));
    },
    moveFromCartToOrder: async (orders, id) => {
        const userData = await API(`users/${id}`, `PUT`, {orders});
        setUser(userData);
        localStorage.setItem(`UserItem`, JSON.stringify(userData));
    },
    deleteAccount: async () => {
        const user = getUser();
        await API(`users/${user.id}`, `DELETE`);
        localStorage.clear();
        document.location.replace("index.html");
    }
}

const UI = {
    loginUser: () => {
        document.querySelector('#loginForm').addEventListener('submit', async e => {
            e.preventDefault();
            const inputEmail = e.target.querySelector('input[data-name="email"]').value;
            const inputPassword = e.target.querySelector('input[data-name="password"]').value;
            const errorContainer = e.target.querySelector(`div[class="error"]`);
            await data.loginUser(inputEmail, inputPassword, errorContainer);
        });
    },
    registrationUser: () => {
        document.querySelector('#registrationForm').addEventListener('submit', async e => {
            e.preventDefault();
            const registrationName = e.target.querySelector('input[data-name="name"]').value;
            const registrationEmail = e.target.querySelector('input[data-name="email"]').value;
            const registrationPassword = e.target.querySelector('input[data-name="password"]').value;
            const registrationPasswordVerify = e.target.querySelector('input[data-name="passwordVerify"]').value;
            const errorContainer = e.target.querySelector(`div[class="error"]`);
            await data.registrationUser(registrationName, registrationEmail, registrationPassword, registrationPasswordVerify, errorContainer);
        });
    },
    onclickButton: async (btn) => {
        const user = getUser();
        const cart = getShoppingCart();
        const id = btn.getAttribute('data');
        const sum = btn.getAttribute('data-price');

        if (Object.keys(user).length === 0) {
            location.href = 'login.html';
        };
        let updetedCart = [];
        const foundObj = cart.filter((item) => item.id === id);
        if (foundObj.length > 0) {
            updetedCart = cart.filter((item) => item.id !== foundObj[0].id);
            btn.classList.remove(`product__cart--in`);
        } else {
            updetedCart = cart
            updetedCart.push({
                id: id,
                count: 1,
                totalPrice: parseInt(sum)
            });
            btn.classList.add(`product__cart--in`)
        };
        document.querySelector(".header__shop--count").innerHTML = updetedCart.length;
        await data.changeProductInShoppingCart(updetedCart);
    },
    removeItemFromCart: async (item, tr) => {
        const cart = getShoppingCart();
        const id = item.getAttribute('data');
        let updetedCart = [];
        const foundObj = cart.filter((item) => item.id === id);
        if (foundObj.length > 0) {
            updetedCart = cart.filter((item) => item.id !== foundObj[0].id);
        }
        document.querySelector(".header__shop--count").innerHTML = updetedCart.length;
        await data.changeProductInShoppingCart(updetedCart);
        tr.remove();
        document.querySelector('#orderSummaryTotal').innerHTML = htmlGenerator.totalSum();
    }
}

const htmlGenerator = {
    renderHeader: () => {
        const user = getUser();

        const hrefLogo = document.createElement('a');
        hrefLogo.href = "index.html";
        hrefLogo.innerHTML = '<img src="images/logo.png" alt="logo" height="45">';
        document.querySelector('.header__container').append(hrefLogo);

        const divContainer = document.createElement('div');
        divContainer.className = 'header__info';
        divContainer.innerHTML = "Hi,"

        const infoUser = document.createElement('a');
        infoUser.className = 'header__user';
        infoUser.setAttribute(`id`, `headerUser`);
        if (Object.keys(user).length === 0) {
            infoUser.href = "login.html";
            infoUser.innerHTML = "Log in";
        } else {
            infoUser.href = "account.html";
            infoUser.innerHTML = user.name;
        }
        const headerShop = document.createElement('div');
        headerShop.className = 'header__shop';

        const userCart = document.createElement('a');
        userCart.setAttribute(`id`, `headerShoppingCart`);
        if (Object.keys(user).length === 0) {
            userCart.href = "login.html";
        } else {
            userCart.href = "shoppingCart.html";
        }
        userCart.innerHTML = '<img src="images/shopping-cart.png" alt="shopping cart" height="20"/>';

        const headerShopCount = document.createElement('span');
        headerShopCount.className = 'header__shop--count';
        headerShopCount.setAttribute(`id`, `headerShoppingCartCount`);
        if (Object.keys(user).length === 0) {
            headerShopCount.innerHTML = '0';
        } else {
            headerShopCount.innerHTML = user.shoppingCart.length;
        }

        const buttonLogOut = document.createElement('button');
        buttonLogOut.className = 'header__logout active';
        buttonLogOut.innerHTML = 'Log Out';

        buttonLogOut.onclick = () => data.userLogOut(user.id);

        userCart.append(headerShopCount);
        headerShop.append(userCart);
        divContainer.append(infoUser, headerShop);
        Object.keys(user).length === 0 ? '' : divContainer.appendChild(buttonLogOut);
        document.querySelector('.header__container').appendChild(divContainer);
    },
    getAllProductsList: () => {
        const productsList = getProductsList();
        const categoriesList = [...new Set(productsList.map(item => item.category))];
        const filteredList = categoriesList.map((name) => productsList.filter(item => item.category === name));
        filteredList.map((list) => htmlGenerator.generateCategoriesContainer(list));
    },
    generateCategoriesContainer: (item) => {
        const categoryName = item[0].category;

        const section = document.createElement("section");
        section.className = `category`;
        section.setAttribute(`data-name`, `${categoryName}`);

        const h2Category = document.createElement("h2");
        h2Category.innerHTML = `${categoryName}`;

        const div = document.createElement("div");
        div.className = `category__container`;

        section.append(h2Category, div);
        document.querySelector('#categoriesContainer').append(section);

        item.filter(item => categoryName.includes(item.category))
            .forEach(data => div.append(htmlGenerator.renderProductsList(data)));
    },
    renderProductsList: (item) => {
        const divContainer = document.createElement("div");
        divContainer.className = `product`;
        divContainer.setAttribute(`data-id`, `${item.id}`);

        const image = document.createElement("img");
        image.className = `product__img`;
        image.setAttribute(`src`, `images/products/${item.img}.png`);
        image.setAttribute(`alt`, `${item.img}`);
        image.setAttribute(`height`, `80`);

        const p = document.createElement("p");
        p.className = `product__title`;
        p.innerHTML = `${item.title}`;

        const productSale = document.createElement("div");
        productSale.className = `product__sale`;

        const saleOld = document.createElement("span");
        saleOld.className = `product__sale--old`;
        saleOld.innerHTML = `$${item.price}`;

        const salePercent = document.createElement("span");
        salePercent.className = `product__sale--percent`;
        salePercent.innerHTML = `-${item.salePercent}%`;

        const productInfo = document.createElement("div");
        productInfo.className = `product__info`;

        const productPrise = document.createElement("span");
        productPrise.className = `product__price`;
        productPrise.innerHTML = `$${item.price}`;

        if (item.sale) {
            const sale = item.price / 100 * item.salePercent;
            const result = Math.ceil(item.price - sale);
            productPrise.innerHTML = `$${result}`;
            productSale.append(saleOld, salePercent);
        }
        productInfo.append(productPrise);
        productInfo.append(htmlGenerator.createBtns(item));

        divContainer.append(image, p, productSale, productInfo);
        return divContainer
    },
    createBtns: (item) => {
        const shoppingCart = getShoppingCart();
        const btn = document.createElement("button");
        btn.setAttribute(`data`, `${item.id}`);
        btn.className = `product__cart`;

        if (item.sale) {
            const sale = item.price / 100 * item.salePercent;
            const result = Math.ceil(item.price - sale);
            btn.setAttribute(`data-price`, `${result}`);
        } else {
            btn.setAttribute(`data-price`, `${item.price}`);
        }

        shoppingCart.map((cartItem) => {
            if (cartItem.id === item.id) {
                btn.classList.add(`product__cart--in`);
            } else {
                btn.classList.add(`product__cart`);
            }
        });

        btn.onclick = async () => await UI.onclickButton(btn);

        const btnImg = document.createElement("img");
        btnImg.setAttribute(`src`, `images/shopping-cart.png`);
        btnImg.setAttribute(`alt`, `shopping cart`);
        btnImg.setAttribute(`height`, `20`);
        btn.append(btnImg);
        return btn
    },
    renderTableContainer: () => {
        const tableContainer = document.createElement("div");
        tableContainer.className = "table__container";

        const table = document.createElement("table");
        table.className = `order__table`;
        table.setAttribute("id", "orderTable");

        const caption = document.createElement("caption");
        caption.innerHTML = `Items in Shopping Cart`;

        const thead = document.createElement("thead");
        const tr = document.createElement("tr");

        const td = document.createElement("td");
        td.innerHTML = `Item Description`;

        const arr = ['Item Description', 'Price', 'Sale', 'Quantity', 'Total', 'Action'];
        const th = arr.map((item) => {
            return `<th>${item}</th>`
        }).join('');
        const tBody = document.createElement('tbody');

        const productsList = getProductsList();
        const cart = getShoppingCart();

        const inCart = [];
        productsList.map((item) => {
            cart.map((idObj) => {
                if (item.id === idObj.id) {
                    inCart.push(item)
                }
            })
        })
        
        inCart.forEach(item => tBody.append(htmlGenerator.createItemsContainer(item)));

        tr.innerHTML = th;
        thead.append(tr);
        table.append(caption, thead, tBody);
        tableContainer.append(table);
        document.querySelector('.shoppingCart__container').append(tableContainer);
        document.querySelector('.shoppingCart__container').append(htmlGenerator.myOrder());
    },
    createItemsContainer: (cartList) => {
        const shopCart = getShoppingCart();
        const tr = document.createElement('tr');
        const itemDescription = document.createElement('td');
        const divDescription = document.createElement('div');
        divDescription.className = 'item__info';
        divDescription.innerHTML = `<img src="images/products/${cartList.img}.png" alt="${cartList.title}" height="100"/>`;
        const divName = document.createElement('div');
        divName.innerHTML = `<p class="item__info--title">${cartList.title}</p>`;
        const price = document.createElement('td');
        price.innerHTML = `$${cartList.price}`;
        const sale = document.createElement('td');
        if (cartList.sale) {
            sale.innerHTML = `<span class="item__sale">-${cartList.salePercent}%</span>`;
        } else {
            sale.innerHTML = '-';
        };
        const quantity = document.createElement('td');
        const inputCount = document.createElement('input');
        inputCount.type = 'number';
        inputCount.min = '0';
        shopCart.forEach((item) => {
            if (item.id === cartList.id) {
                inputCount.value = `${item.count}`
            }
        })
        const total = document.createElement('td');
        if (cartList.sale) {
            const sale = cartList.price / 100 * cartList.salePercent;
            const result = Math.ceil((cartList.price - sale) * inputCount.value);
            total.innerHTML = `$${result}`;
        } else {
            total.innerHTML = cartList.price * inputCount.value;
        };
        inputCount.addEventListener('input', event => {
            const inputValue = event.target.value;
            let result = '';
            if (cartList.sale) {
                const sale = cartList.price / 100 * cartList.salePercent;
                result = Math.ceil((cartList.price - sale) * inputValue);
                total.innerHTML = `$${result}`;
            } else {
                result = cartList.price * inputValue;
                total.innerHTML = `$${result}`;
            };
            data.changeCountValue(cartList.id, event.target.value, result);
            document.querySelector('#orderSummaryTotal').innerHTML = `$${htmlGenerator.totalSum()}`;    
        })
        const action = document.createElement('td');
        const btn = document.createElement('button');
        btn.setAttribute(`data`, `${cartList.id}`);
        btn.className = 'item__remove';
        btn.innerHTML = '<img src="images/delete.png" alt="delete" height="20"/>';

        btn.onclick = async () => await UI.removeItemFromCart(btn, tr);

        action.append(btn);
        divDescription.append(divName);
        itemDescription.append(divDescription);
        quantity.append(inputCount);
        tr.append(itemDescription, price, sale, quantity, total, action);
        return tr
    },
    totalSum: () => {
        let productPrices = [];
        const cart = getShoppingCart();
        cart.map(prod => productPrices.push(prod.totalPrice));
        const totalPrice = productPrices.reduce((sum, currentValue) => sum + currentValue, 0);
        return totalPrice
    },
    myOrder: () => {
        const orderedSum = document.createElement('div');
        orderedSum.className = 'order__summary';
        const form = document.createElement('form');
        form.setAttribute('id', 'orderSummary');
        const table = document.createElement('table');
        const caption = table.createCaption();
        caption.textContent = 'My Order Summary';
        const tbody = table.createTBody();
        const tr = tbody.insertRow();
        const th = document.createElement('th')
        th.innerHTML = 'Order Total'
        tr.append(th);
        const td = tr.insertCell();
        td.id = 'orderSummaryTotal';
        td.innerHTML = `$${htmlGenerator.totalSum()}`;

        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerHTML = 'Compete Order';

        form.addEventListener('submit', async event => {
            event.preventDefault();
            const cart = getShoppingCart();
            const user = getUser();

            const orderCart = [];
            const shoppingCart = [];

            cart.map(item => orderCart.push(item))
            await data.moveFromCartToOrder(orderCart, user.id);
            await data.changeProductInShoppingCart(shoppingCart);
            window.location.href = 'account.html'
        })
        form.append(table, btn);
        orderedSum.append(form);
        return orderedSum
    },
    renderOrderedTable: () => {
        const tableContainer = document.createElement("div");
        tableContainer.className = "table__container";

        const table = document.createElement("table");
        table.className = `order__table`;
        table.setAttribute("id", "orderTable");

        const caption = document.createElement("caption");
        caption.innerHTML = `Ordered Items`;

        const thead = document.createElement("thead");
        const tr = document.createElement("tr");

        const td = document.createElement("td");
        td.innerHTML = `Item Description`;

        const arr = ['Item Description', 'Price', 'Sale', 'Quantity', 'Total'];
        const th = arr.map((item) => {
            return `<th>${item}</th>`
        }).join('');
        const tBody = document.createElement('tbody');

        const productsList = getProductsList();
        const history = getOrder();

        const inOrder = [];
        productsList.map((item) => {
            history.map((idObj) => {
                if (item.id === idObj.id) {
                    inOrder.push(item)
                }
            })
        })
        inOrder.forEach(item => tBody.append(htmlGenerator.createOrderItemsContainer(item, history)));

        tr.innerHTML = th;
        thead.append(tr);
        table.append(caption, thead, tBody);
        tableContainer.append(table);
        document.querySelector('.shoppingCart__container').append(tableContainer);
        document.querySelector('.shoppingCart__container').append(htmlGenerator.myInfo());
    },
    createOrderItemsContainer: (item, history) => {
        const tr = document.createElement('tr');
        const info = history.map(order => {
            if (order.id === item.id) {
                return `<td>${order.count}</td><td>$${order.totalPrice}</td>`
            }
        }).join('');

        tr.innerHTML = `
        <td>
            <div class="item__info">
                <img src="images/products/${item.img}.png" alt="${item.title}" height="100"/>
                <div>
                <p class="item__info--title">${item.title}</p>
            </div>
            </div>
        </td>
        <td>$${item.price}</td>
        <td> ${item.sale ? `<span class="item__sale">-${item.salePercent}%</span>` : '-'}</td>${info}`
        
        return tr
    },
    myInfo: () => {
        const user = getUser();
        const myInfo = document.createElement('div');
        myInfo.className = 'order__summary';
        myInfo.innerHTML = `
        <table>
            <caption>My Info</caption>
            <tbody>
                <tr>
                    <th>Name:</th>
                    <td id="userInfoName">${user.name}</td>
                </tr>
                <tr>
                    <th>Email:</th>
                    <td id="userInfoEmail">${user.email}</td>
                </tr>
            </tbody>
        </table>`;

        const div = document.createElement('div');
        div.className = 'order__summary--btns';
        const btn = document.createElement('btn');
        btn.className = 'btn delete__acc';
        btn.type = 'button';
        btn.setAttribute(`id`, `deleteAcc`);
        btn.innerHTML = 'Delete Account';

        btn.onclick = () => data.deleteAccount();

        div.append(btn)
        myInfo.appendChild(div);

        return myInfo
    }
}
const initPage = async () => {
    const pageHref = window.location.href;
    await data.getUserFromLS();
    await data.getAllProductsList();

    if (pageHref.includes("login.html")) {
        htmlGenerator.renderHeader();
        UI.loginUser();
        UI.registrationUser();
    };

    if (pageHref.includes("index.html")) {
        htmlGenerator.renderHeader();
        htmlGenerator.getAllProductsList();
    };

    if (pageHref.includes("account.html")) {
        htmlGenerator.renderHeader();
        htmlGenerator.renderOrderedTable();
    };

    if (pageHref.includes("shoppingCart.html")) {
        htmlGenerator.renderHeader();
        htmlGenerator.renderTableContainer();
    };
};
initPage();