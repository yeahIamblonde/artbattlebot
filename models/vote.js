const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  battleid: {type: String, required: true},
  userid: {type: String, required: true},
  vote: {type: Number, required: true}
},
{
    timestamps: true
}
);


module.exports = mongoose.model("Vote", VoteSchema);