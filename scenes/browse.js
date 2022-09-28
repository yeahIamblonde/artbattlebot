const WizardScene = require('telegraf/scenes/wizard')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const Book = require('../models/book')
const Vote = require('../models/vote')
const User = require('../models/user')
const Invoice = require('../models/invoice')
const charge  = require('lightning-charge-client')('https://pay.elephantthink.com/lightning-charge/btc/', 'a90ccc973d1b58ebe792e8d81200f2050e4fe057113633864da54ba65e144ef8')


const sort = [
  {index: {createdAt:-1}, desc: 'Newest'},
  {index: {price:1}, desc: 'Cheapest'},
]

const browseWizard = new WizardScene(
    'browseScene',
    async (ctx) => {
        getBook(ctx, 0)
        //return ctx.wizard.next();
        ctx.scene.leave()
    },
  );


async function showBook(ctx, dir) {
  const kbItems = []
  kbItems.push([Markup.callbackButton('Show Painting ' + ctx.session.imageId, 'Show')])
  //check if the user already votes
  //var vote = await Vote.findOne({battleid: ctx.session.book._id,userid: ctx.from.id})
  //console.log("Battle id:", ctx.session.book._id)
  //console.log(vote)
  //if (!vote)
    kbItems.push([Markup.callbackButton('Vote for this painting', 'Vote')])
    kbItems.push([Markup.callbackButton('Test', 'Test')])
  const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
  extra.caption = ctx.session.book.title
  ctx.session.imageId = 1
  ctx.session.msg_id = await ctx.replyWithPhoto(ctx.session.book.cover_img, extra)
  /*
} else {
    // which image to show
    var image = (ctx.wizard.state.image ==1 ? ctx.session.book.cover_img : ctx.session.book.cover_img2)
    ctx.telegram.editMessageMedia(
      ctx.wizard.state.msg_id.chat.id,
      ctx.wizard.state.msg_id.message_id,0,
      {type: 'photo', 
      media: image}, extra) 
  }
  */
}

async function defaultButtons(ctx) {
  // not nice that default buttons are defined in 2 places, need to improve showbook
  const kbItems = []
  //only show previous and next if more than 1 book found
  kbItems.push([Markup.callbackButton('Show Painting ' + ctx.wizard.state.image, 'Show')])
  kbItems.push([Markup.callbackButton('Vote for this painting', 'Vote')])
  const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
  await ctx.telegram.editMessageReplyMarkup(
    ctx.wizard.state.msg_id.chat.id,
    ctx.wizard.state.msg_id.message_id,
    0,
    {inline_keyboard: kbItems}
    //extra
    )
  return
}

function removeButtons(ctx) {
  const kbItems =  []
  const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
  ctx.telegram.editMessageReplyMarkup(
    ctx.wizard.state.msg_id.chat.id,
    ctx.wizard.state.msg_id.message_id,
    0,
    extra)
  return
}

async function getBook(ctx, dir) {
  var book = await Book.findOne({votesAvailable: { $gt: 0 }}).exec()
  if (book) { 
      // keep this book on the session
      ctx.session.book = book
      // keep the active image number 
      ctx.session.imageId = 1
      // show the book
      showBook(ctx,dir)
  }
}


module.exports = browseWizard;
