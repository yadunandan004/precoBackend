var mongoose=require('mongoose');
var Schema=mongoose.Schema;
var printSchema=new Schema({
    src:{type:String,required:true},
    user:{type:String,required:true},
    date: { type: Date, default: Date.now }
});

var print=mongoose.model('prints',printSchema);

module.exports=print;