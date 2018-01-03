/*
* mysql 连接池
* 用法:
* var query=require("./configmysql_pool");
* query("select * from table where id=?", [1], function(err,results,fields){
*   //do something
* });
* */

var mysql=require("mysql");
var dbconfig = require('./db.config.js');

var pool = mysql.createPool(
    dbconfig.dev
    //{
    //    host: 'localhost',
    //    user: 'root',
    //    password: '',
    //    database: 'my_db',
    //    port: '3306'
    //}
);

var db=function(sql,options,callback){
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,options,function(err,results,fields){
                //释放连接
                conn.release();
                if(err) throw err;
                //事件驱动回调
                callback(results,fields);
            });
        }
    });
};

module.exports = db;