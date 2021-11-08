const Order = require("./Order");

const shawarma_price = 2;
const pizza_price = 3;
const burger_price = 4;
const small_size_price = 1.5;
const medium_size_price = 2.5;
const large_size_price = 3.5;
const toppings_price = 1;
const drinks_price = 2;
const tax = 0.13;

const OrderState = Object.freeze({
  WELCOMING: Symbol("welcoming"),
  SIZE: Symbol("size"),
  TOPPINGS: Symbol("toppings"),
  DRINKS: Symbol("drinks"),
  ITEMS: Symbol("items"),
  RESUME: Symbol("resume"),
  RECEIPT: Symbol("receipt"),
  PAYMENT: Symbol("payment")
});

module.exports = class ShwarmaOrder extends Order {
  constructor(sNumber, sUrl) {
    super(sNumber, sUrl);
    this.stateCur = OrderState.WELCOMING;
    this.sSize = "";
    this.sToppings = "";
    this.sDrinks = "";
    this.sItem = "";
    this.sFlag = "true";
    this.sPrice = 0;
    this.sTax = 0;
    this.sTotalAmount = 0;
  }

  handleInput(sInput) {
    let aReturn = [];
    switch (this.stateCur) {
      case OrderState.WELCOMING:
        this.stateCur = OrderState.SIZE;
        if (this.sFlag == "true") {
          aReturn.push("Welcome to Ole's Take Away");
          this.sFlag = "false";
        }

        aReturn.push("Please enter the item you would like to have");
        aReturn.push("Menu \n 1. Shawarma \n 2. Pizza \n 3. Burger");
        break;

      case OrderState.SIZE:
        this.sItem = sInput;

        if (this.sItem.toLowerCase() == "shawarma") {
          this.stateCur = OrderState.TOPPINGS;
          this.sPrice += shawarma_price;
        } else if (this.sItem.toLowerCase() == "pizza") {
          this.stateCur = OrderState.TOPPINGS;
          this.sPrice += pizza_price;
        } else if (this.sItem.toLowerCase() == "burger") {
          this.stateCur = OrderState.TOPPINGS;
          this.sPrice += burger_price;
        }

        aReturn.push("What Size would you like to have?");
        aReturn.push("small | medium | large")
        break;
      case OrderState.TOPPINGS:
        this.sSize = sInput;
        this.stateCur = OrderState.DRINKS
        if (sInput.toLowerCase() == "small" || sInput.toLowerCase() == "medium" || sInput.toLowerCase() == "large") {
          if (this.sSize.toLowerCase() == "small") {
            this.sPrice += small_size_price;
          } else if (this.sSize.toLowerCase() == "medium") {
            this.sPrice += medium_size_price;
          } else if (this.sSize.toLowerCase() == "large") {
            this.sPrice += large_size_price;
          }
          this.sPrice += toppings_price;
          aReturn.push("What toppings or fillings would you like to have?");
        }
        else {
          aReturn.push("Please enter SMALL or MEDIUM or LARGE");
          this.stateCur = OrderState.TOPPINGS;
        }

        break;

      case OrderState.DRINKS:
        this.sToppings = sInput;
        this.stateCur = OrderState.RESUME;
        aReturn.push("Would you like to have a coke?");
        break;

      case OrderState.RESUME:

        this.stateCur = OrderState.RECEIPT;
        this.sDrinks = sInput;

        if (sInput.toLowerCase() != "no") {
          this.sDrinks = sInput;
        }

        aReturn.push("Thank-you for your order of");
        aReturn.push(`${this.sSize} ${this.sItem} with ${this.sToppings}`);
        this.sText += `${this.sSize} ${this.sItem} with ${this.sToppings}`;

        if (this.sDrinks == 'yes') {
          aReturn.push("with Drinks");
          this.sText += " with Drinks. \n"
          this.sPrice += drinks_price;
        }
        else {
          aReturn.push("without Drinks");
          this.sText += " without Drinks. \n"
        }

        aReturn.push("Would you like to order more?");
        break;
      case OrderState.RECEIPT:

        if (sInput.toLowerCase() == "yes") {
          aReturn.push("Please confirm again.");
          this.stateCur = OrderState.WELCOMING;
        }
        else {
          this.stateCur = OrderState.PAYMENT;

          aReturn.push("Thank-you for your order of");
          aReturn.push(this.sText);

          this.sTax = this.sPrice * tax;
          this.sTotalAmount = this.sTax + this.sPrice;

          aReturn.push(`Total amount is ${this.sTotalAmount.toFixed(2)}`);
          aReturn.push(`Please pay for your order here`);
          aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
        }
        break;

      case OrderState.PAYMENT:
        var customerAddress = sInput.purchase_units[0].shipping.address;
        this.isDone(true);
        console.log(sInput);
        let d = new Date();
        d.setMinutes(d.getMinutes() + 20);
        aReturn.push(`Your order will be delivered to " ${customerAddress.address_line_1}, ${customerAddress.admin_area_2},
          ${customerAddress.admin_area_1},${customerAddress.postal_code},${customerAddress.country_code}" at
           ${d.toTimeString()}`);
        break;
    }
    return aReturn;
  }

  renderForm(sTitle = "-1", sAmount = "-1") {
    // your client id should be kept private
    if (sTitle != "-1") {
      this.sItem = sTitle;
    }
    if (sAmount != "-1") {
      this.nOrder = sAmount;
    }
    const sClientID = process.env.SB_CLIENT_ID || 'put your client id here for testing ... Make sure that you delete it before committing'
    return (`
    <!DOCTYPE html>

    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
      <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
    </head>
    
    <body>
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
      <script
        src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
      </script>
      Thank you ${this.sNumber} for your order of amount $${this.sTotalAmount.toFixed(2)}.
      <div id="paypal-button-container"></div>

      <script>
        paypal.Buttons({
            createOrder: function(data, actions) {
              // This function sets up the details of the transaction, including the amount and line item details.
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: '${this.sTotalAmount.toFixed(2)}'
                  }
                }]
              });
            },
            onApprove: function(data, actions) {
              // This function captures the funds from the transaction.
              return actions.order.capture().then(function(details) {
                // This function shows a transaction success message to your buyer.
                $.post(".", details, ()=>{
                  window.open("", "_self");
                  window.close(); 
                });
              });
            }
        
          }).render('#paypal-button-container');
        // This function displays Smart Payment Buttons on your web page.
      </script>
    
    </body>
        
    `);

  }
}