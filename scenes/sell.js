const WizardScene = require('telegraf/scenes/wizard')
const User = require('../models/user')
const Invoice = require('../models/invoice')
const Book = require('../models/book')
const Extra = require('telegraf/extra')
const { format } = require('path')
const charge  = require('lightning-charge-client')('https://pay.elephantthink.com/lightning-charge/btc/', 'a90ccc973d1b58ebe792e8d81200f2050e4fe057113633864da54ba65e144ef8')

const sellWizard = new WizardScene(
    'sellScene',
    (ctx) => {
      ctx.reply('Please send me the first image for the Art Battle.')
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.photo) {
        ctx.wizard.state.cover_img1 = ctx.message.photo[0].file_id
        ctx.reply('Ok, now send me the second image for the Art Battle')
        return ctx.wizard.next();  
      } else {
        ctx.scene.leave()
        return ctx.reply('Not a valid image. Exiting the scene...')
      }
    },
    async (ctx) => {
      if (ctx.message.photo) {
        ctx.wizard.state.cover_img2 = ctx.message.photo[0].file_id
        // add book to the database
        var newBook = new Book({
          cover_img: ctx.wizard.state.cover_img1,
          cover_img2: ctx.message.photo[0].file_id,
          owner: ctx.from.id,
          votesAvailable:2
        })
        newBook.save()
        console.log("Battle added: ")
        ctx.reply('Success. Your Battle has been created.')
      } else 
        return ctx.reply('Not a valid image. Exiting the scene...')
      ctx.scene.leave()
    }
  );

  module.exports = sellWizard;
