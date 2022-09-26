const { Telegraf } = require('telegraf')
const {session} = require("telegraf")
require("dotenv").config();
//const bot = new Telegraf('1235099983:AAHLYf3orXi8rBDObJDiteNiWLXsemPpQCQ') //EWTEstBot
const bot = new Telegraf(process.env.TELEGRAM) //EWtxbot

const axios = require('axios');
const mongoose = require('mongoose');

// models
const User = require('./models/user')
const Invoice = require('./models/invoice')
const Book = require('./models/book')

const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

//scenes
const Scene = require('telegraf/scenes/base')
const withdrawWizard = require('./scenes/wdraw')
const sellWizard = require('./scenes/sell')
const browseWizard = require('./scenes/browse')
const searchWizard = require('./scenes/search')
const updatePriceWizard = require('./scenes/updatePrice')
const updateTitleWizard = require('./scenes/updateTitle')
const requestWizard = require('./scenes/request')
const messageWizard = require('./scenes/message')

const Stage = require('telegraf/stage')
const stage = new Stage()
const { leave } = Stage

const charge  = require('lightning-charge-client')('https://pay.elephantthink.com/lightning-charge/btc/', process.env.LCTOKEN)

bot.use(session())
bot.use(stage.middleware())

stage.register(sellWizard)
stage.register(browseWizard)
stage.register(searchWizard)
stage.register(withdrawWizard)
stage.register(updatePriceWizard)
stage.register(updateTitleWizard)
stage.register(requestWizard)
stage.register(messageWizard)
stage.command('cancel', leave())


// remote connection
//mongoose.connect('mongodb+srv://mags4sats:PQJXytYAs2XVYFKI@cluster0-pkmmz.mongodb.net/test4sats?authSource=admin&replicaSet=Cluster0-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true',{useNewUrlParser: true}, function (err) {
mongoose.connect(process.env.MONGODB,{useNewUrlParser: true}, function (err) {

/*
mongoose.connect('mongodb://localhost:27017/energyweb?readPreference=primary&appname=MongoDB%20Compass&ssl=false',{useNewUrlParser: true}, function (err) {
*/
  if (err) throw err;
  console.log('Successfully connected to MongoDB v2.0');
});
mongoose.set('useFindAndModify', false);

const stream = charge.stream()
stream.on('payment', inv => {
  // payment received
  console.log(`invoice ${ inv.id } of ${ inv.msatoshi } paid`)

  Invoice.findOne({id: inv.id}, async function(err, invoice){
    if (err) return
    if (invoice) {
        // notify seller of payment
        bot.telegram.sendMessage(invoice.owner,`Payment Received.\nYou received a payment of:${(invoice.msatoshi / 1000).toFixed(2)} sats for ${invoice.description}`,{parse_mode:'HTML'})
        // notify buyer and send book
        bot.telegram.sendMessage(invoice.userid,`Payment Received.\nHere is your book:`,{parse_mode:'HTML'})
        bot.telegram.sendDocument(invoice.userid, invoice.file_id).catch(function(error){ console.log(error); })
        // update the earnings of the book
        console.log(`Book: ${invoice.book_id}`)
        Book.findByIdAndUpdate(invoice.book_id,{ $inc: {"earned": inv.msatoshi}}, function(err, result){
          if(err)
              console.log(err)
        })
    } else console.log('Invoice not found')
  })
})

bot.start(async(ctx) => {
  // check if user exists if not enter user into database
  if (!await User.findOne({ id: ctx.from.id })) {
    var newUser = new User({id:ctx.from.id,username:ctx.from.username})
    newUser.save()
    console.log("New user:", ctx.from.username, ctx.from.id)
  }

  await ctx.setMyCommands([
    {
      command: '/browse',
      description: 'Browse the active Art Battles'
    },
    {
      command: '/create',
      description: 'Create a new Art Battle'
    }
  ])
  try {
    ctx.reply('Welcome, this bot allows you to particpate in Artbattles by voting for one of the paintings in the battle.\n\nIf you vote for the winning painting you will receive 1 ArtCod3 token.\n\nCheck out the current battle /browse')
  } catch (error) {
      console.log('error in sendmessage')
  }
})

bot.help(async (ctx) => {
  const commands = await ctx.getMyCommands()
  const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, '')
  return ctx.reply(info)
})

bot.command('browse', async (ctx) => {
  console.log(`${ctx.from.username}: /browse`)
  ctx.session.searchTitle = ''
  ctx.scene.enter('browseScene')
})

bot.command('create', async (ctx) => {
  console.log(`${ctx.from.username}: /create`)
  ctx.scene.enter('sellScene')
})


bot.command('message', async (ctx) => {
  console.log(`${ctx.from.username}: /message`)
  // ignore if doesnt come from Jenny
  if (ctx.from.id =='1046888755')
    ctx.scene.enter('messageScene')
})


bot.startPolling();
//setup(bot)


// the following code is to clear the update queue
async function setup(tgBot) {
  tgBot.polling.offset = await clearOldMessages(tgBot);
  tgBot.startPolling();
}

async function clearOldMessages(tgBot) {
  // Get updates for the bot
  const updates = await tgBot.telegram.getUpdates(0, 100, -1);

  //  Add 1 to the ID of the last one, if there is one
  return updates.length > 0
          ? updates[updates.length-1].update_id + 1
          : 0
  ;
}

function notifyPayment(owner)
{

}
