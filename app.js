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
const Vote = require('./models/vote')

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

//globals
var imageId = 1
var battle
var msg_id


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

bot.start(async(ctx) => {
  // check if user exists if not enter user into database
  if (!await User.findOne({ id: ctx.from.id })) {
    var newUser = new User({id:ctx.from.id,username:ctx.from.username})
    newUser.save()
    console.log("New user:", ctx.from.username, ctx.from.id)
  }

  await ctx.setMyCommands([
    {
      command: '/balance',
      description: 'Check your current balance'
    },
    {
      command: '/battle',
      description: 'Start the Art Battle'
    },
    {
      command: '/create',
      description: 'Create a new Art Battle'
    }
  ])
  try {
    ctx.reply('Welcome, this bot allows you to particpate in Art Battles by voting for one of the paintings in the battle.\n\nIf you vote for the winning painting you will receive 1 ACT.\n\nCheck out the current /battle')
  } catch (error) {
      console.log('error in sendmessage')
  }
})

bot.help(async (ctx) => {
  const commands = await ctx.getMyCommands()
  const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, '')
  return ctx.reply(info)
})

bot.command('battle', async (ctx) => {
  console.log(`${ctx.from.username}: /battle`)
  //ctx.session.searchTitle = ''

  //ctx.scene.enter('browseScene')
  battle = await Book.findOne({votesAvailable: { $gt: 0 }}).exec()
  if (battle) { 
      // keep the active image number 
      imageId = 1
      const kbItems = []
      kbItems.push([Markup.callbackButton('Show Painting 2', 'Show')])
      kbItems.push([Markup.callbackButton('Vote for this painting', 'Vote')])
      const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
      msg_id = await ctx.replyWithPhoto(battle.cover_img, extra)   
  } else {
    ctx.reply('No Battles available')
  }
})

bot.command('create', async (ctx) => {
  console.log(`${ctx.from.username}: /create`)
  ctx.scene.enter('sellScene')
})

bot.command('balance', async (ctx) => {
  console.log(`${ctx.from.username}: /balance`)
  // get the user balance from database
  var user = await User.findOne({ id: ctx.from.id })
  if (user)
    ctx.reply(`Your Balance:\n${user.balance} ACT`)
})

bot.command('message', async (ctx) => {
  console.log(`${ctx.from.username}: /message`)
  // ignore if doesnt come from Jenny
  if (ctx.from.id =='1046888755')
    ctx.scene.enter('messageScene')
})

bot.action('Show', async (ctx) => {
  var kbItems = []
  kbItems.push([Markup.callbackButton('Show Painting ' + imageId, 'Show')])
  kbItems.push([Markup.callbackButton('Vote for this painting', 'Vote')])
  const extra = Extra.markup(Markup.inlineKeyboard(kbItems))
  // flip the active image
  imageId = (imageId === 1 ? 2 : 1)
  var image = (imageId ==1 ? battle.cover_img : battle.cover_img2)
  ctx.telegram.editMessageMedia(
    msg_id.chat.id,
    msg_id.message_id,0,
    {type: 'photo', 
    media: image}, extra) 
  console.log(imageId)
  console.log(ctx.from.first_name)
  console.log(ctx.from)
  console.log(ctx.chat)
  return
})

bot.action('Test', async (ctx) => {
  // flip the active image
console.log(ctx.session.book)
  return
})

bot.action('Vote', async (ctx) => {
  // @vote
  // check if not already voted
  var vote = await Vote.findOne({battleid: battle._id, userid: ctx.from.id}).exec()
  if (vote)  
    return

  var newVote = new Vote({
    battleid: battle._id,
    userid: ctx.from.id, 
    vote: imageId
  })
  newVote.save()
  //update the votes in the battle table
  if (imageId == 1)
    battle.vote1++
  else
    battle.vote2++
  
  battle.votesAvailable = battle.votesAvailable - 1
  battle.save()
  var voteTxt = (battle.votesAvailable == 1 ? "vote" : "votes")
  await ctx.reply(`${ctx.from.first_name} just voted. ${battle.votesAvailable} ${voteTxt} remaining`)
  if (battle.votesAvailable <= 0) {
    // no more votes available, send result of the battle to all users
    await ctx.reply(`The battle has ended.\nPainting 1: ${battle.vote1} votes\nPainting 2: ${battle.vote2} votes`)
  
    // check the winning painting
    var winVoteId = (battle.vote1 > battle.vote2 ? 1 : 2) 
    const cursor = Vote.find({battleid: battle._id, vote: winVoteId}).cursor();
    await cursor.eachAsync(async function(doc) {
      ctx.telegram.sendMessage(doc.userid,`Congratulations, you voted for the winning painting.\n\n1 ACT has been added to your /balance.`)
      // increate the users balance
      await User.findOneAndUpdate({id: doc.userid},{ $inc: {balance: 1}})
    })
  }  
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
