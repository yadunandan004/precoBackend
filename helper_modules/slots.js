'use strict';
const preco=require("./printer");
const printer=require("../routes/orders").printer;
function slots()
{
    this.pbslots={};
}
slots.prototype.addSlot=function(user,shop,dur,type,strt,fils,fn)
{
   //creating a queue
    //var recnt
    //console.log('shop: '+shop);
    var avail=this.slotAvailable(shop,strt,dur);
    if(avail==1)
    {
    var id=this.pbslots[shop].length;
   
    if(id==0)
    {
        this.pbslots[shop].recent=id;
    }
    else if(this.pbslots[shop].recent>strt)
    {
        this.pbslots[shop].recent=id;
    }
    var slot={
        id:id,
        user:user,
        start:strt,
        duration:dur,
        shop:shop,
        type:type,
        src:fils
    };
    this.pbslots[shop].push(slot);
   // console.log(JSON.stringify(slot));
    this.Timer(slot);
    fn(slot) ; 
    }
    else
    {
        fn(avail) ;
    }
};

slots.prototype.removeSlot=function(shop,id)
{
    //remove slot from slot array
  for(var i=0;i<this.pbslots[shop].length;i++)
  {
     if(this.pbslots[shop][i].id==id)
       {
           this.pbslots[shop].splice(i, 1);
           console.log('slot removed');
           return 1;
       }
  }
  return 0;
}

slots.prototype.slotAvailable=function (shop,start,dur)
{
    //checks whether the selected slot is available or not 
   console.log(shop+' prev: '+this.pbslots[shop]);
    if(typeof(this.pbslots[shop])=="undefined")
    {
        this.pbslots[shop]=[];   
            console.log('slot created');
            return 1;
    }
    else
    {
        console.log('slot contains something');    
        if(this.pbslots[shop].length==0)
        {
            return 1;
        }
        else
        {
            console.log('checking all slots');
            for(let i=0;i<this.pbslots[shop].length;i++)
            {
                let res=this.timeChecker(this.pbslots[shop][i].start,this.pbslots[shop][i].duration,start,dur);
                if(res==0)
                {
                    console.log('cannot book slot');
                    return res;
                }
            }
            console.log('slot created');
            return 1;
        }
    }
   
}
slots.prototype.timeChecker=function(t1,dur1,t2,dur2)
{
    let et1=new Date(t1.getTime());
    let et2=new Date(t2.getTime());
    let min1=t1.getMinutes()+dur1;
    let min2=t2.getMinutes()+dur2;
    et1.setMinutes(min1);
    et2.setMinutes(min2);
    console.log('min1:'+min1+' min2:'+min2);
    console.log('t2:'+t2.getTime()+'t1:'+t1.getTime()+'et1:'+et1.getTime()+'dur1:'+dur1);
    //console.log('min1:'+t1.getTime()+' min2:'+t2.getTime()+'endt1:'+et1.getTime());
    let case1=(t2.getTime()>=t1.getTime())&&(t2.getTime()<=et1.getTime());
    let case2=(et2.getTime()>=t1.getTime())&&(et2.getTime()<=et1.getTime());
    let case3=(t2.getTime()<=t1.getTime())&&(et2.getTime()>=et1.getTime());
    console.log(case1+':'+case2+':'+case3);
    if(case1||case2||case3)
    {
        return 0;
    }
}
slots.prototype.getSlots=function (shop)
{
     //returns all slots in the slot array
     if(typeof(this.pbslots[shop])!="undefined"){
         if(this.pbslots[shop].length==0)
        {
            return 0;
        }
        else
        {
            return this.pbslots[shop];
        } 
     }
     else
     {
        this.pbslots[shop]=[];
        return 0;
     }
}

slots.prototype.Timer=function (order)
{
//starts counting down till the scheduled time
console.log('In timer:'+order.start.getTime());
   let dt=new Date();
   dt.setHours(dt.getHours()+5); //utc to ist
   dt.setMinutes(dt.getMinutes()+30);
   
   let t=order.start.getTime()-dt.getTime();
   console.log(dt);
   console.log(order.start);
   console.log('time left :'+t);
   (function(ordr,time,obj){
        setTimeout(()=>{
       //sending request to printer
       obj.sessionStart(ordr);
    },t);
   })(order,t,this);
}

slots.prototype.sessionStart=function (order)
{
    //maintain a session of a user within printer
    if(/print/i.test(order.type))
    {
        //enable printing
        //printer(order);
        console.log('printing started');
    }
    else if(/copy/i.test(order.type))
    {
        //enable copying
        
    }
    else 
    {
        //enable scanning
        
    }
    console.log(parseInt(order.duration)*60);
    (function(ordr,obj){
        setTimeout(()=>{
           obj.sessionEnd(ordr);
        },(order.duration*60));
    })(order,this);
}

slots.prototype.sessionEnd=function (order)
{
    this.removeSlot(order.shop,order.id);
    //remove auth info from printer
}

slots.prototype.sendAuth=function (info,fun)
{
    fun(1);
}



/*function checkSlot(shop,id)
{

    if(pbslots[shop].length==0)
    {
        return 0;
    }
    else
    {
        if(pbslots[shop].recent==pbslots[shop][id].start)
        {
            return 1;
        }
        else
        {
            return 0;
        }
    }
}*/
module.exports=slots;