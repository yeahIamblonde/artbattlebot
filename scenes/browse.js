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
        return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message.text == '/sell') {
        console.log(`${ctx.from.username}: /sell`)
        removeButtons(ctx)
        ctx.scene.enter('sellScene')
      }
      if (ctx.message.text == '/browse') {
        console.log(`${ctx.from.username}: /browse`)
        removeButtons(ctx)
        ctx.session.searchTitle = ''
        ctx.scene.enter('browseScene')
      }
      if (ctx.message.text == '/search') {
        console.log(`${ctx.from.username}: /search`)
        removeButtons(ctx)
        ctx.scene.enter('searchScene')  
      }
      if (ctx.message.text == '/request') {
        console.log(`${ctx.from.username}: /request`)
        removeButtons(ctx)
        ctx.scene.enter('requestScene')  
      }
    },
  );

browseWizard.action('Buy', async (ctx) => {
  removeButtons(ctx)
  ctx.reply(`Pay the following lightning invoice`)
  try {
    console.log(`Invoice requested by: ${ctx.from.username}, ${ctx.from.id}`)
    const inv = await charge.invoice({ description: `${ctx.session.book.title}`, currency: 'USD', amount: ctx.session.book.price, metadata: { customer_id: 123, product_id: 456 } })
    ctx.reply(inv.payreq)
      // enter invoice in invoice table
      var newInvoice = new Invoice({id:inv.id, msatoshi:inv.msatoshi,description:inv.description,userid:ctx.chat.id, file_id:ctx.session.book.file_id, book_id:ctx.session.book._id, owner: ctx.session.book.owner})
      newInvoice.save()
  } catch (error) {
    ctx.reply('Error in BTCPayserver. Please try again later')
    console.log('error in btc pay server')
  }
  ctx.scene.leave('browseScene')
})

browseWizard.action('Show', async (ctx) => {
  // flip the active image
  ctx.wizard.state.image = (ctx.wizard.state.image === 1 ? 2 : 1)
  showBook(ctx, -1)
  return
})

browseWizard.action('Vote', async (ctx) => {
  // save the vote
  console.log(ctx.session.book._id)
  var newVote = new Vote({
    battleid: ctx.session.book._id,
    userid: ctx.from.id, 
    vote: ctx.wizard.state.image
  })
  newVote.save()
  //update the votes in the battle table
  if (ctx.wizard.state.image == 1)
    ctx.session.book.vote1++
  else
    ctx.session.book.vote2++
  
  ctx.session.book.votesAvailable = ctx.session.book.votesAvailable - 1
  ctx.session.book.save()
  await ctx.reply('Thank you, Your vote has been recorded')
  if (ctx.session.book.votesAvailable <= 0) {
    // no more votes available, send result of the battle to all users
    const cursor = User.find().cursor();
    await cursor.eachAsync(async function(doc) {
      console.log(doc);
    });
    ctx.reply(`The battle has ended.\nPainting 1: ${ctx.session.book.vote1} votes\nPainting 2: ${ctx.session.book.vote2} votes`)
  } 
  return
})

browseWizard.action('Next', async (ctx) => {
  await getBook(ctx, 1)
  return
})

browseWizard.action('Send', async (ctx) => {
  ctx.reply('Ok here is the book')
  removeButtons(ctx)
  ctx.telegram.sendDocument(ctx.from.id, ctx.session.book.file_id).catch(function(error){ console.log(error); })
  ctx.scene.leave('browseScene')
  return
})

browseWizard.action('Yes', async (ctx) => {
  ctx.reply('Book has been deleted')
  Book.findByIdAndDelete(ctx.session.book.id, function (err) {
    if(err) console.log(err);
      console.log("Successful deletion");
  });
  //removeButtons(ctx)
  ctx.scene.leave('browseScene')
  return
})

browseWizard.action('No', async (ctx) => {
  ctx.reply('Never mind...')
  //removeButtons(ctx)
  ctx.scene.leave('browseScene')
  return
})


browseWizard.action('Edit', async (ctx) => {
  await ctx.telegram.editMessageReplyMarkup(
    ctx.wizard.state.msg_id.chat.id,
    ctx.wizard.state.msg_id.message_id,
    0,
    {inline_keyboard: [
          [
            Markup.callbackButton('Title', 'Title'), Markup.callbackButton('Price', 'Price'), Markup.callbackButton('Delete', 'Delete')
          ],
          [
            Markup.callbackButton('Back', 'Back')
          ]
      ]
    })
  return
})

browseWizard.action('Title', async (ctx) => {
  removeButtons(ctx)
  ctx.scene.enter('updateTitleScene')
  return
})

browseWizard.action('Price', async (ctx) => {
  removeButtons(ctx)
  ctx.scene.enter('updatePriceScene')
  return
})

browseWizard.action('Back', async (ctx) => {
  defaultButtons(ctx)
})

browseWizard.action('Delete', async (ctx) => {
  removeButtons(ctx)
  const kbItems =  [
    [Markup.callbackButton('Yes', 'Yes'), Markup.callbackButton('No', 'No')],
  ]
  const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
  ctx.reply('Are you sure you want to delete this item?', extra)
  return
})

browseWizard.action('Earned', (ctx) => {
 if (Math.floor(ctx.session.book.earned/1000) > 0)
    ctx.scene.enter('withdrawScene')
  else
    ctx.reply('You have not earned enough sats to withdraw')
})

browseWizard.action('Sort', async (ctx) => {
  ctx.session.sort = ctx.session.sort + 1
  if (ctx.session.sort > 1) ctx.session.sort = 0
  showBook(ctx, 1)
  return
})

async function showBook(ctx, dir) {
  const kbItems = []
  kbItems.push([Markup.callbackButton('Show Painting ' + ctx.wizard.state.image, 'Show')])
  //check if the user already votes
  var vote = await Vote.findOne({battleid: ctx.session.book._id,userid: ctx.from.id})
  if (!vote)
    kbItems.push([Markup.callbackButton('Vote for this painting', 'Vote')])
  const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
  if (dir == 0) {
      extra.caption = ctx.session.book.title
      ctx.wizard.state.image = 1
      ctx.wizard.state.msg_id = await ctx.replyWithPhoto(ctx.session.book.cover_img, extra)
  } else {
    // which image to show
    var image = (ctx.wizard.state.image ==1 ? ctx.session.book.cover_img : ctx.session.book.cover_img2)
    ctx.telegram.editMessageMedia(
      ctx.wizard.state.msg_id.chat.id,
      ctx.wizard.state.msg_id.message_id,0,
      {type: 'photo', 
      media: image}, extra) 
  }
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
  var book = await Book.findOne().exec()
  if (book) { 
      // keep this book on the session
      ctx.session.book = book
      // keep the active image number 
      ctx.wizard.state.image = 2
      // show the book
      showBook(ctx,dir)
  }
}


module.exports = browseWizard;
