const WizardScene = require('telegraf/scenes/wizard')
const Request = require('../models/request')

const requestWizard = new WizardScene(
    'requestScene',
    (ctx) => {
      ctx.reply('Send me the title of the book or magazine that you are looking for. You can also include the author.')
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text) {
        // add request to the database
        var newRequest = new Request({
            title: ctx.message.text, 
            owner: ctx.from.id
        })
        newRequest.save()
        ctx.reply('Success. Your request has been added. We will let you know when it gets filled.')
      } else {
        return ctx.reply('Not a valid title, use text only please')
      }
      ctx.scene.leave()
    }
)

module.exports = requestWizard