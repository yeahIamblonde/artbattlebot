require("dotenv").config();
const WizardScene = require('telegraf/scenes/wizard')
const Book = require('../models/book')
const lightningPayReq = require('bolt11')
const axios = require('axios');
const apitoken = process.env.APITOKEN
const baseURL = 'https://pay.elephantthink.com'

const withdrawWizard = new WizardScene(
    'withdrawScene',
    (ctx) => {
      ctx.reply(`Please send me an invoice for a maximum of ${(Math.floor(ctx.session.book.earned/1000))} sats`)
      return ctx.wizard.next();
    },
    async (ctx) => {
      try {
        var decoded = lightningPayReq.decode(ctx.message.text)
        if (decoded.millisatoshis <= ctx.session.book.earned)  {
          // valid invoice
          // send the payment to the user and deduct from his book balance
          // if i have the book id i can easily update the balance
          console.log(ctx.session.book.id)
          Book.findByIdAndUpdate(ctx.session.book.id,{ $inc: {"earned": -decoded.millisatoshis}}, function(err, result){
            if(err)
                console.log(err)
            else
                console.log(result)
          })
          // notify jessica
          ctx.telegram.sendMessage('61329998',`Withdrawel request processed: ${Math.floor(decoded.millisatoshis / 1000)} sats`,{parse_mode:'HTML'})
          pay(ctx.message.text)
          ctx.scene.leave()
          return ctx.reply('Your withdrawel request has been processed.')
        } else {
          ctx.scene.leave()
          return ctx.reply('Sorry, this invoice is higher than the amount you have earned')
        }
      } catch(e) {
        ctx.scene.leave()
        return ctx.reply('Sorry, you did not send a valid lightning BOLT11 invoice')
      }     
    }
);

async function pay(bolt11){
  try {
       const res = await axios({
           method: 'post',
           url: baseURL+'/api/v1/server/lightning/BTC/invoices/pay',
           data: {
               "BOLT11": bolt11
           },
           headers: {
               'Authorization' : 'token '+apitoken
           }
       })
       console.log(res.data)
   } catch (error) {
       console.log('Thats an error')
   }
   
}


module.exports = withdrawWizard;
/*

const WizardScene = require('telegraf/scenes/wizard')
const User = require('../models/user')
const Extra = require('telegraf/extra')

const withdrawWizard = new WizardScene(
    'withdrawScene', // first argument is Scene_ID, same as for BaseScene
    async (ctx) => {
      ctx.reply(`Please send me an invoice for a maximum of ${(ctx.session.book.earned/1000).toFixed(0)} sats`)
      console.log(ctx.wizard.cursor)
      return ctx.wizard.next();
    },
    (ctx) => {
      console.log(ctx.wizard.cursor)
        ctx.reply('Step 3')
        return ctx.wizard.next()
    },
  );
  
  module.exports = withdrawWizard;
  */
