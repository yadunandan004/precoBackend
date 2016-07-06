var mongoose=require("mongoose");
var Schema=mongoose.Schema;
var order=new Schema({
    user:{type:String,required:true},
    type:{type:String,required:true},
    duration:{type:Number,required:true},
    shopid:{type:String,required:true},
    date:{type:Date,default:Date.now},
    completed:{type:Boolean,default:false},
    src:[{path:String,name:String,copies:Number,option:String}],
    status:{type:Number,default:0}      //states:0:request,1:ongoing,2:finished
});

var printorder=mongoose.model('orders',order);
module.exports=printorder;