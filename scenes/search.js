const WizardScene = require('telegraf/scenes/wizard')

const searchWizard = new WizardScene(
    'searchScene',
    (ctx) => {
      ctx.reply('Please send me the keyword on which you want to search for books.')
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text) {
        console.log(`Searching for:${ctx.message.text}`)
        ctx.session.searchTitle = ctx.message.text
        ctx.scene.enter('browseScene')
      } else {
        ctx.scene.leave()
        return ctx.reply('Not a valid search term')
      }
    }
);

module.exports = searchWizard;