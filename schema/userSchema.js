var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var userSchema=new Schema({
    name:{type:String,required:true},
    college:{type:String},
    email:{type:String,required:true,unique:true},
    pass:{type:String,required:true},
    phone:{type:String,required:true},
    orders:{type:Number},
    currentorder:{type:String},
    wallet:{type:Number,default:1000}
});

var user=mongoose.model('user',userSchema);
module.exports=user;