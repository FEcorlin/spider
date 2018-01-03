var express = require('express');
var router = express.Router();
var fs = require('fs');
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var request = require('request');
var db = require('../config/mysql_pool');


var url = "http://weixin.sogou.com";//首页地址

//http://weixin.sogou.com/pcindex/pc/pc_0/pc_0.html   第1页
//http://weixin.sogou.com/pcindex/pc/pc_0/1.html    第2页
// pc_0  代表第一个分类
// 一直到pc_21

var art_lists_url = [];//文章地址列表
var i = 0,j= 1,li_i=0;

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendfile('views/index.html');
});

router.get('/start', function (req, res, next) {
    startFetch()  //主程序开始运行
    res.send('doing');
});

function startFetch(){
    i = 0;
    console.log('==========start================');
    getFirstList(i);
}

//获取一级url列表
function getFirstList(index) {
    var list_url = url+'/pcindex/pc/pc_'+index+'/pc_'+index+'.html';
    //采用http模块向服务器发起一次get请求
    console.log(list_url);
    console.log(art_lists_url.length);
    http.get(list_url, function (res) {
        var html = '';        //用来存储请求网页的整个html内容
        res.setEncoding('utf-8'); //防止中文乱码
        //监听data事件，每次取一块数据
        res.on('data', function (chunk) {
            html += chunk;
        });
        //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
        res.on('end', function () {
            var $ = cheerio.load(html);
            if ($(".news-list").length > 0) {//判断是否还有内容
                $(".news-list li").each(function (index, item) {
                    art_lists_url.push($(this).find('.txt-box').find('h3').find('a').attr('href'));
                });
                getSecList(j);
            }
            else {
                getContent(art_lists_url[li_i]);//列表爬完，那链接去取内容
            }
        });
    });
}
//获取二级url列表，相当于一级的下一页
function getSecList(index){
    var list_url = url+'/pcindex/pc/pc_'+i+'/'+index+'.html';
    console.log(list_url);
    console.log(art_lists_url.length);
    http.get(list_url, function (res) {
        var html = '';        //用来存储请求网页的整个html内容
        res.setEncoding('utf-8'); //防止中文乱码
        //监听data事件，每次取一块数据
        res.on('data', function (chunk) {
            html += chunk;
        });
        //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
        res.on('end', function () {
            var $ = cheerio.load(html);
            if ($("body>li").length > 0) {//判断是否还有内容
                $("body>li").each(function (index, item) {
                    art_lists_url.push($(this).find('.txt-box').find('h3').find('a').attr('href'));
                });
                j++;
                getSecList(j);
            }
            else {
                i++;
                j=1;
                getFirstList(i);
            }
        });
    });
}
//循环url数组，爬去内容
function getContent(url){
    http.get(url, function (res) {
        var html = '';        //用来存储请求网页的整个html内容
        res.setEncoding('utf-8'); //防止中文乱码
        //监听data事件，每次取一块数据
        res.on('data', function (chunk) {
            html += chunk;
        });
        //监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
        res.on('end', function () {
            var $ = cheerio.load(html);
            var title = $("#activity-name").text() || '';
            var author = $("#post-user").text() || '';
            var content = $("#js_content").innerHTML || $("#js_content").html();
            var platform = 'sougo';
            var orgin_url = url;
            var category = '';
            var description = '';
            var image = '';
            db("insert into articles (title,author,content,create_time,platform,orgin_url,category,description,image) VALUES(?,?,?,?,?,?,?,?,?)",
                [title,author,content,new Date().getTime(),platform,orgin_url,category,description,image],
                function (results, fields) {
                    li_i++;
                    if(li_i < art_lists_url.length){
                        getContent(art_lists_url[li_i]);
                    }
                    //res.json({ok:1,info:'新建成功'});
                });
        });
    });
}
module.exports = router;
