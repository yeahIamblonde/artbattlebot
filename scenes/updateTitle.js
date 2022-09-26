const WizardScene = require('telegraf/scenes/wizard')
const Book = require('../models/book')

const updateTitleWizard = new WizardScene(
    'updateTitleScene',
    (ctx) => {
      ctx.reply('Send me the new title for this item, You can also include the author.')
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text) {
        // update the title of this item
        console.log(`Updating title to: ${ctx.message.text}`)
        await Book.findByIdAndUpdate(ctx.session.book._id, {
            title: ctx.message.text
        })
        ctx.reply('Success. The title has been updated.')
        ctx.scene.leave()
      } else {
        ctx.scene.leave()
        return ctx.reply('Not a valid title, please try again')
      }
    }
)

module.exports = updateTitleWizard