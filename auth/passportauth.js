var userModel=require('../schema/userSchema.js');
module.exports=function(passport,FacebookStrategy,config,mongoose){
    passport.serializeUser(function(user,done){
        done(null,user.id);
    });
    passport.deserializeUser(function(id,done){
        userModel.findById(id,function(err,user){
            done(err,user);
        });
    });
    passport.use(new FacebookStrategy({
        clientID:config.fb.appID,
        clientSecret:config.fb.appSecret,
        callbackURL:config.fb.callbackURL,
        profileFields:['id','displayName','photos','emails']
    },function(accessToken,refreshToken,profile,done){
        //check if user exits in mongodb database
        //if not create one and return the profile 
        //if exists simply return the profile
        user.findOne({'email':profile.email},function(err,result){
            if(result)
            {
                done(null,result);
            }
            else
            {
                var newUser=new userModel({
                        profileId:profile.id,
                        name:profile.displayName,
                        email:profile.email,
                        profilePic:profile.photos[0].value || ''
                    });
                    newUser.save(function(err){
                        if(!err)
                        {
                            done(null,newUser);
                        }
                    });
            }
        });
    }))
}