const WizardScene = require('telegraf/scenes/wizard')
const User = require('../models/user')
const Extra = require('telegraf/extra')

const withdrawWizard = new WizardScene(
    'withdrawScene', // first argument is Scene_ID, same as for BaseScene
    async (ctx) => {
      var user = await User.findOne({ id: ctx.from.id })
      ctx.session.balance = user.balance
      ctx.reply(`Balance: ${user.balance} EWT\nHow many EWT tokens would you like to withdraw? \n\nClick /max to withdraw your full balance.`)
      ctx.wizard.state.withdrawData = {}
      ctx.wizard.state.withdrawData.amount = user.balance;
      return ctx.wizard.next();
    },
    (ctx) => {
      // validation example
      if (ctx.message.text != '/max') {
        // check if we received a valid amount
        var amount = parseFloat(ctx.message.text)
        if (amount < 0 || amount > ctx.wizard.state.withdrawData.amount) {
          ctx.reply(`Please enter an amount betweet 0 and ${ctx.wizard.state.withdrawData.amount}`);
          return; 
        }
        ctx.wizard.state.withdrawData.amount = amount;
      }
      ctx.reply('Enter the address to which you want to withdraw');
      return ctx.wizard.next();
    },
    async (ctx) => {
      ctx.reply(`Please confirm withdrawal of ${ctx.wizard.state.withdrawData.amount} EWT to ${ctx.message.text}`,
      Extra.HTML().markup((m) =>
      m.inlineKeyboard([
        m.callbackButton('Yes', 'Yes'),
        m.callbackButton('No', 'No')
      ])))
      //return ctx.scene.leave();
    },
  );
  
  withdrawWizard.action('Yes', (ctx) => {
    ctx.scene.leave()
    return ctx.reply(`Your tokens have been send`)
  })
  
  withdrawWizard.action('No', (ctx) => {
    ctx.scene.leave()
    return ctx.reply(`Your witdrawal request has been cancelled`)
  })

  module.exports = withdrawWizard;