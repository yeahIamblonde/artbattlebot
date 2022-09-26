const WizardScene = require('telegraf/scenes/wizard')
const Book = require('../models/book')

const updatePriceWizard = new WizardScene(
    'updatePriceScene',
    (ctx) => {
      ctx.reply('Send me the new price for this item in cents')
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text) {
        var price = parseFloat(ctx.message.text)
        if (price < 1 || price > 10000 || !price) {
            console.log('user entered wrong price')
            ctx.reply(`Please enter an amount greater than 1 and less than 10000 cents`);
            return; 
        }
        // update the price of this item
        await Book.findByIdAndUpdate(ctx.session.book._id, {
            price: price
        })
        ctx.reply('Success. Item price has been updated.')
        ctx.scene.enter('browseScene')
        //ctx.scene.leave()
      } else {
        ctx.scene.leave()
        return ctx.reply('Not a valid price, please try again')
      }
    }
)

module.exports = updatePriceWizard