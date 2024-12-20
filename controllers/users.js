const bcrypt =require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const { getDb, initializeDatabase } = require('../db-connection');

initializeDatabase(); // Call this in app.js for initialization
const db = getDb(); // Safely get the connection
exports.login = (req,res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).render('login',{msg:'Please Enter Your Email and Password',msg_type: "error"});
        }

        db.query('select * from users_auth where email=?',[email],(error,result)=>{
            if(result.length <= 0)
                return res.status(401).render("login", {
                    msg: "Please Enter Your Email or Password",
                    msg_type: "error"
                });
            else 
                if (!(bcrypt.compare(password, result[0].password)))
                    return res.status(401).render("login", {
                        msg: "Please Enter Your Email or Password Incorrect...",
                        msg_type: "error"
                    });
                else
                {
                    const id = result[0].name;
                    const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_EXPIRES_IN,
                    });
                    const cookieOptions = {
                        expires: new Date(
                            Date.now() +
                                process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                            ),
                            httpOnly: true,
                    };
                    res.cookie("joes",token,cookieOptions);
                    res.status(200).redirect("/home");
                }
        });
    }
    catch (error) {
        console.log("user login "+error);
    }
}
exports.register=(req,res)=>{
    const {name,email,password,confirm_password} = req.body;
    db.query('select email from users_auth where email=?',
        [email],
        async (error,result)=>{
        if(error)
        {
            console.log("query error "+error);
        }
        if(result.length>0)
        {
            return res.render('register',{msg:'Email id already Taken.',msg_type: "error"});
        }
        else if(password !== confirm_password)
        {
            return res.render('register',{msg:'Password do not Match.',msg_type: "error"});
        }
        let hashedPassword = await bcrypt.hash(password,8);
        db.query('insert into users_auth set ?', 
        { name: name,email: email,password: hashedPassword },
    (error, result) => {
        if(error){
            console.log("Insert Query "+error);
        }
        else{
            return res.render('register',{msg:'User Registration Success.',msg_type: "good"});
        }
    }
    );
   });
};

exports.isLoggedIn = async (req, res, next) => {
    if(req.cookies.joes){
        try{
                const decode = await promisify(jwt.verify)(
                    req.cookies.joes,
                    process.env.JWT_SECRET
                );
                db.query("select * from users_auth where name=?",[decode.id],(err,results) => {
                    if(!results)
                    {
                        return next();
                    }
                    req.user = results[0];
                    return next();
                });
            }
            catch (error){
                console.log("Login Check Error "+error);
                return next();
            }
        }
        else
            next();
};

exports.logout = async (req,res) => {
    res.cookie("joes","logout",{
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true,
    });
    res.status(200).redirect("/");
};