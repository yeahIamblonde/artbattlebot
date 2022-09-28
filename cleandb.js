require("dotenv").config();
const Vote = require('./models/vote')
const User = require('./models/user')
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB,{useNewUrlParser: true}, function (err) {
    if (err) throw err;
      console.log('Successfully connected to MongoDB v2.0');
});
mongoose.set('useFindAndModify', false);

async function cleandb() {
  Vote.deleteMany({ battleid: '632fee3e61b68d6378953a59' }, function (err) {
    if(err) console.log(err);
    console.log("Successful deletion");
  });
}

// check the winning painting
async function test() {
  var winVoteId = 1
  const cursor = Vote.find({battleid: "632fee3e61b68d6378953a59", vote: winVoteId}).cursor();
  await cursor.eachAsync(async function(doc) {
    console.log(doc.userid)
    //ctx.telegram.sendMessage(doc.userid,`Congratulations, you voted for the winning painting.\n\n1 ACT has been added to your /balance.`)
    // increate the users balance
    await User.findOneAndUpdate({id: doc.userid},{ $inc: {balance: 1}})  
  })  
}

async function test2(){
  const res = await User.findOneAndUpdate({id: "116712660"},{ $inc: {balance: 1}})  
  console.log(res)
}

cleandb()



//User.updateMany({}, { balance: 0 });