const WizardScene = require('telegraf/scenes/wizard')
const User = require('../models/user')

const messageWizard = new WizardScene(
    'messageScene',
    (ctx) => {
      ctx.reply('Send me the name or id of the user you would like to message')
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text) {
        // check if we have given a username or userid, a username would start with @
        if (ctx.message.text.charAt(0)=='@') {
            // find this user
            const name = ctx.message.text.substring(1)
            console.log(`name: ${name}`)
            const user = await User.findOne({ username: name })
            if (user) {
                console.log("User found:", user)
                ctx.wizard.state.userid = user.id
            } else {
                console.log("User not found:")
                ctx.reply(`User not found`)
                return ctx.scene.leave()
            }
        } else {
            // we have received the userid, ignore for the moment
            ctx.scene.leave()
            //ctx.wizard.state.userid = ctx.message.text
        }
        ctx.reply(`ok now send me the message that you want to send to user: ${ctx.wizard.state.userid}`)
        return ctx.wizard.next(); 
      }
    }, 
    async (ctx) => {
        if (ctx.message.text) {
            ctx.reply(`Send ${ctx.wizard.state.userid}: ${ctx.message.text}`)
            ctx.telegram.sendMessage(ctx.wizard.state.userid,ctx.message.text)
        }
        ctx.scene.leave()
    }
)

module.exports = messageWizard