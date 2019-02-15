var express = require('express');
var router = express.Router();
var fs = require('fs');
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var request = require('request');
var db = require('../config/mysql_pool');
var fs = require('fs');


var url = "http://www.526tu.com/htm/mp43/{number}.htm"; //首页地址
var _begin = 2346; // 开始 23317
var _end = 2857; // 结束2857


/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendfile('views/index.html');
});

router.get('/start', function (req, res, next) {
    startFetch()  //主程序开始运行
    res.send('doing');
});

function startFetch(){
    console.log('==========start================');
    getFirstList();
}

//获取一级url列表
function getFirstList() {
    var list_url = url.replace('{number}', _begin);

    //采用http模块向服务器发起一次get请求
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
            var _url = $(".downurl a").text() || $(".downurl").html() || '';
            console.log(_url);
            fs.appendFile('./public/result.text', _url + '\r');
            if (_begin < _end) { //下一个地址
                _begin ++;
                getFirstList();
            } else {
                console.log('======end==========');
                return true;
            }
        });
    });
}
// //获取二级url列表，相当于一级的下一页
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
