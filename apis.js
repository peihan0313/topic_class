var fs = require("fs");
//讀取設定檔--------------------
var readFile = function (fileName) {
    return new Promise(function (resolve, reject) {
        fs.readFile(fileName, function (error, data) {
            if (error) reject(error);
            resolve(data);
        });
    });
};
//----------------------------*
//寫入結果檔
var writeFile = function (fileName) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(fileName, function (error, data) {
            if (error) reject(error);
            resolve(data);
        });
    });
};
//------------------------------------*
//截網址參數------------------------------------
function getParameterByUrl(url, regx) {
    url = url.split("?")[1].split("&")
    for (var i = 0; i < url.length; i++) {
        if (url[i].match(regx)) {
            return url[i].split("=")[1]
        }
    }
}
//---------------------------------------------*
//取得新打開的分頁--------------------

var listenPage = function (browser, event) {
    return new Promise(function (resolve, reject) {
        browser.once(event, async function (target) {
            console.log(event + " be listened")
            let newPage = await target.page()
            if (false) {
                reject("err")
            }
            resolve(newPage)

        })
    })
}
//------------------------------------*
//寫入writeStream
function inputWriteStream(stream, title, url, classCode, schoolCode, serial) {
    stream.write("\r\n")
    stream.write("-----------------------------------------------------")
    stream.write("\r\n")
    stream.write(title)
    stream.write("\r\n")
    stream.write(url)
    stream.write("\r\n")
    stream.write("classCode : " + classCode)
    stream.write("\r\n")
    stream.write("schoolCode : " + schoolCode)
    stream.write("\r\n")
    stream.write("serial : " + serial)
    stream.write("\r\n")
    stream.write("-----------------------------------------------------")
}
//----------------------------------*
//登入教育網-------------------------
async function signInLearn(browser, learn104Page, Id, Pwd, ) {
    await learn104Page.goto("http://lrnmgr01.104.com.tw/main/login.cfm")
    await learn104Page.evaluate(function (Id, Pwd) {
        document.forms[0].empId.value = Id
        document.forms[0].pwd.value = Pwd
    }, Id, Pwd)
    await Promise.all([
        learn104Page.click("input[type='submit']"),
        listenPage(browser, "targetchanged"),
        learn104Page.waitForNavigation("load"),
    ])
    console.log("網址改變...")
    var changeurl = await learn104Page.evaluate(() => {
        return window.location.href
    })
    if (changeurl !== "http://lrnmgr01.104.com.tw/index.cfm") {
        console.log("帳號密碼可能有誤請檢查")
        return
    } else {
        await learn104Page.close()
    }
}
//-------------------------------------*
//導入從search.txt取得的頁面並取得筆數--------------------------------
async function pageFrom_txt(page, url, writeStream_arr, class_selector) {
    await page.goto(url)
    try {
        var linkNum = await page.evaluate((class_selector) => {
            // linkNum = document.myclass.querySelectorAll(".ptxt > a").length
            // const dom = document.myclass.querySelectorAll(".ptxt > a")[0]
            //linkNum = document.myclass.querySelectorAll("form > table tr :nth-of-type(2) td table tr td a").length
            linkNum = document.myclass.querySelectorAll(class_selector).length
            return linkNum
        }, class_selector)
    } catch (e) {
        console.log(`${url}\n取得筆數錯誤!`)
        return 0
    }
    writeStream_arr[0].write("\r\n")
    writeStream_arr[0].write(url)
    return linkNum
}
//------------------------------------------------------------------*
//search(課程業取得機構代碼課程代碼並到教育網查詢serial)奇中一筆發生錯誤就不會修改頁面--------------------------------------
async function search(browser, url, linkNum, page, writeStream_arr, file_html, changedSerial, class_selector) {
    console.log(`${url}\n有${linkNum}筆...`)

    for (var i = 1; i <= linkNum; i++) {
        console.log(`第${i}筆查尋開始...`)
        try {
            await page.evaluate((i, class_selector) => {
                //document.querySelectorAll('form > table tr :nth-of-type(2) td table tr td a')[i - 1].onclick()
                document.querySelectorAll(class_selector)[i - 1].onclick()
            }, i, class_selector)
        } catch (e) {
            console.log(e)
        }
        //await page.click(`.cls:nth-child(${i}) > .ptxt > a`)
        var newPage = await listenPage(browser, "targetcreated")
        try {
            await newPage.waitForSelector('#btnSave')
        } catch (e) {
            console.log(`課程業在第${i}筆錯誤!\n確認虛擬網址是否設定正確!`)
            await newPage.close()
            writeStream_arr[1].write("\r\n")
            writeStream_arr[1].write("-----------------------------------------------------")
            writeStream_arr[1].write("\r\n")
            writeStream_arr[1].write(`${url}\n課程業在第${i}筆錯誤!\n課程可能已下線或虛擬網址設定錯誤!`)
            writeStream_arr[1].write("\r\n")
            writeStream_arr[1].write("-----------------------------------------------------")
            continue
        }
        var url_becut = await newPage.url()
        var pageTitle = await newPage.title()
        await newPage.close()
        var classCode = getParameterByUrl(url_becut, /theclass=/g)
        var schoolCode = getParameterByUrl(url_becut, /school=/g)
        var searchPage = await browser.newPage()
        await searchPage.goto("http://lrnmgr01.104.com.tw/eshop/datadeal/data_choice.cfm")
        await searchPage.evaluate(function (classCode, schoolCode) {
            document.form15.class_code.value = classCode;
            document.form15.school_code.value = schoolCode;
        }, classCode, schoolCode)
        await Promise.all([
            searchPage.click("input[value='尋找serial']"),
            searchPage.waitForNavigation("load"),
        ])
        serial = await searchPage.evaluate(function () {
            var serial = document.querySelector("table:nth-child(4) tr:nth-child(2) > td:nth-child(1)").innerText
            return serial
        })
        await searchPage.close()
        inputWriteStream(writeStream_arr[0], pageTitle, url_becut, classCode, schoolCode, serial)
        file_html = file_html.replace(changedSerial[i - 1], `${i - 1}-${changedSerial[i - 1]}`)//將要替換的serial加上編碼
        file_html = file_html.replace(`${i - 1}-${changedSerial[i - 1]}`, serial)
        console.log(`被換掉的${i - 1}-${changedSerial[i - 1]}換成的${serial}`)
        console.log(`第${i}筆結束`)

    }
    return file_html
}
//----------------------------------------------------------------------------------------------------------------------*
//取得search.txt的設定---------------------------------
async function getConfig(txt) {
    var f1 = await readFile(txt);
    var url_arr = f1.toString().match(/^\[.+\]$/gim).map(function (v) {
        return v.slice(1, v.length - 1)
    })
    var id_arr = f1.toString().match(/^\{.+\}$/gim).map(function (v) {
        return v.slice(4, v.length - 1)
    })
    class_selector = f1.toString().match(/^\(.+\)$/gim).map(function (v) {
        return v.slice(1, v.length - 1)
    })
    return [url_arr, id_arr, class_selector]
}
//--------------------------------------
//取得要被替換的value(為了做repalce)------
function getSerial(str) {
    var serial_arr = str.match(/value="\d{5,10}"/gi).map(function (val) {
        return val.match(/\d{5,10}/gi)
    })

    return serial_arr
}
//---------------------------------------*
module.exports = {
    getConfig,
    search,
    pageFrom_txt,
    signInLearn,
    inputWriteStream,
    listenPage,
    getParameterByUrl,
    writeFile,
    readFile,
    getSerial

}