// ==UserScript==
// @name         PotPlayer云盘-专供版
// @namespace    https://github.com/Bleu404/PotplayerPanVideoSV
// @version      1.0.8
// @description  此脚本为《PotPlayer播放云盘视频》姊妹篇,需配合MediaPlayParse - PanVideo.as脚本使用。在potplayer中选择画质、字幕,迅雷云盘增加原画，阿里云盘增加时长。
// @author       bleu
// @compatible   edge Tampermonkey
// @compatible   chrome Tampermonkey
// @compatible   firefox Tampermonkey
// @license      MIT
// @match        https://pan.xunlei.com/*
// @match        https://www.aliyundrive.com/*
// @icon         https://fastly.jsdelivr.net/gh/Bleu404/PRPO@latest/png/ppvsv.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @connect      *
// @connect      xunlei.com
// @connect      aliyundrive.com
// @connect      jianguoyun.com
// @connect      teracloud.jp
// @require      https://fastly.jsdelivr.net/npm/sweetalert2@11.1.0/dist/sweetalert2.all.min.js
// @require      https://fastly.jsdelivr.net/npm/bleutools@1.0.2/bleutools.min.js
// ==/UserScript==

(function () {
    'use strict';
    const ORGXHRSRH = XMLHttpRequest.prototype.setRequestHeader;
    let bleuc,contextMenu, itemsInfo, arryIndex, Option, observer,cloud;
    const flieTypeStr = ".wmv,.rmvb,.avi,.mp4,.mkv,.flv,.swf.mpeg4,.mpeg2,.3gp,.mpga,.qt,.rm,.wmz,.wmd,.wvx,.wmx,.wm,.mpg,.mpeg,mov,.asf,.m4v,";
    const tools = {
        getCloudName() {
            switch (document.domain) {
                case 'xunlei.com':
                    cloud = xunlei;
                    break;
                case 'www.aliyundrive.com':
                    cloud = aliyun;
                    this.hookXHRHeader();
                    break;
            }
        },
        checkFileType(name) {
            let type = name.toLowerCase().substring(name.lastIndexOf('.')) || "bleu"
            return flieTypeStr.indexOf(`${type},`) >= 0 ? true : false
        },
        async putFileInWebdav(name, info) {
            let header = {
                "authorization": `Basic ${btoa(`${bleuc.cun}:${bleuc.cpw}`)}`
            }
            let url = `https://${bleuc.cip}/PanPlaylist`;
            let method = bleuc.cip.indexOf('teracloud')>0?'GET':'PROPFIND';
            await bleu.XHR(method, url, undefined, header, undefined).then( () => {}
            ,async()=>{await bleu.XHR('MKCOL', url, undefined, header, undefined)})
            url = `https://${bleuc.cip}/PanPlaylist/${name}`;
            await bleu.XHR('PUT',url , info, header, 'xml').then(() => {
                bleu.swalInfo(`✅${name}`, 3000, 'center');
            }, () => bleu.swalInfo(`❌${name}`, 3000, 'center'))
        },
        checkConfig() {
            bleuc = JSON.parse(GM_getValue('bleuc') || null) || {cip: '',cun: '',cpw: ''};
            if (!(bleuc.cip != '' && bleuc.cun != '' && bleuc.cpw != '')) {
                bleu.swalInfo(`❗请先设置WEBDAV`, '', 'center')
                return false
            }
            return true
        },
        saveConfig() {
            let temp = document.querySelector('#cip').value.trim()
            temp = temp.charAt(temp.length - 1) === '/' ? temp.substring(0, temp.length - 1) : temp
            temp = temp.indexOf('https://') < 0 ? temp : temp.replace('https://', '')
            GM_setValue("bleuc", JSON.stringify({
                'cip': temp,
                'cun': document.querySelector('#cun').value.trim(),
                'cpw': document.querySelector('#cpw').value.trim(),
            }));
        },
        configHtml() {
            bleuc = JSON.parse(GM_getValue('bleuc') || null) || {cip: '',cun: '',cpw: ''};
            let html = `
                <div class="bleuc_config_item"><p>
                <div><label>主机:</label><input type="text" class="bleuc_inp" id="cip" value="${bleuc.cip}"/></div>
                <div><label>用户:</label><input type="text" class="bleuc_inp" id="cun" value="${bleuc.cun}"/></div>
                <div><label>密码:</label><input type="text" class="bleuc_inp" id="cpw" value="${bleuc.cpw}"/></div></p></div>
                `;
            return html;
        },
        hookXHRHeader() {
            XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
                if(header == "x-signature"){
                    aliyun._signature=value;
                }
                return ORGXHRSRH.apply(this, arguments);
            }
        },
        cssStyle: `
            .bleuc_config_item{border-radius: 10px;font-size: 20px;margin: 12px 50px;color: #fff;background: linear-gradient(45deg,#12c2e9, #c471ed, #f64f59);box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);}
            .bleuc_config_item label{font-size: 15px}
            .bleuc_config_item input.bleuc_inp{margin: 0px 10px;font-size: 15px;background: linear-gradient(45deg,#12c2e9, #c471ed, #f64f59);border-style:none;color:black;width:200px}
            .bleuc_config_item p{text-align: left;margin: 0px 20px;}`,

    }
    const xunlei = {
        addTag() {
            if (contextMenu.innerText.match(/PotPlayer/)) return
            let ul = document.createElement('ul');
            ul.innerHTML = `<a id="bleuReSave" class="pan-dropdown-menu-item">PotPlayer打开</a>`;
            contextMenu.firstChild.prepend(ul.firstChild);
            main.addClickEvent();
        },
        getselectFilesInfo() {
            let temp = document.querySelectorAll('li.pan-list-item.pan-list-item-active');
            temp.forEach((item) => {
                this._pushItem(item.__vue__.info);
            })
        },
        async updateFile(item) {
            Option["list"].push({
                "title": item.name,
                "url": `https://api-pan.xunlei.com/drive/v1/files/${item.id}`
            });
        },
        async openNextDir(item) {
            let url = `https://api-pan.xunlei.com/drive/v1/files?limit=100&parent_id=${item.id}&filters={"phase":{"eq":"PHASE_TYPE_COMPLETE"},"trashed":{"eq":false}}&with_audit=true`;
            await bleu.XHR('GET', url, undefined, Option.header).then((res) => {
                arryIndex++;
                res.files.forEach((item) => {
                    xunlei._pushItem(item);
                })
            },()=>{bleu.swalInfo("❗进出目录之后重新转存", '', 'center')})
        },
        findContext(node) {
            if (node.className === 'pan-content') {
                node = node.querySelector('div.pan-dropdown-menu.context-menu');
                if (!node) return;
                contextMenu = node;
                xunlei.addTag();
            }
        },
        closeMenu() {},
        _pushItem(temp) {
            if (!itemsInfo[arryIndex]) itemsInfo[arryIndex] = [];
            if (temp.kind === 'drive#file' && !tools.checkFileType(temp.name)) return
            let itemInfo = {
                'id': temp.id,
                'isdir': temp.kind === 'drive#file' ? false : true,
                'name': temp.name,
            };
            itemsInfo[arryIndex].push(itemInfo);
        },
        getHeaderInfo() {
            Option.header = {};
            Option.header.withCredentials = false;
            Option.header['content-type'] = 'application/json';
            for (let key in localStorage) {
                let temp = localStorage.getItem(key)
                if (key.indexOf('credentials') === 0) {
                    Option.header["Authorization"] = JSON.parse(temp).token_type + ' ' + JSON.parse(temp).access_token;
                    Option["clientid"] = key.substring(key.indexOf('_') + 1);
                }
                if (key.indexOf('captcha') === 0)
                    Option.header['x-captcha-token'] = JSON.parse(temp).token
                if (key === 'deviceid')
                    Option.header['x-device-id'] = temp.substring(temp.indexOf('.') + 1, 32 + temp.indexOf('.') + 1)
            }
        },
        async finallyFunc() {
            Option.header["clientid"] = Option["clientid"];
            await tools.putFileInWebdav('panvideo.txt', JSON.stringify(Option));
            unsafeWindow.location.href = `potplayer://panvideo##xunlei##https://${bleuc.cip}/PanPlaylist/panvideo.txt##${bleuc.cun}##${bleuc.cpw}`;
        }
    }
    const aliyun = {
        addTag() {
            if (contextMenu.innerText.match(/PotPlayer|新建/)) return
            let ul = document.createElement('ul');
            ul.innerHTML = `<li id="bleuReSave" class="ant-dropdown-menu-item ant-dropdown-menu-item-only-child" role="menuitem"><div class="outer-menu--ihDUR"><div data-confirm="false" class="menu-wrapper--1ZYh_" data-spm-anchor-id="aliyundrive.drive.0.i11.40516c75ahPUGN"><div class="menu-name--1F5vk" data-spm-anchor-id="aliyundrive.drive.0.i12.40516c75ahPUGN">PotPlayer打开</div></div></div></li>`;
            contextMenu.prepend(ul.firstChild);
            main.addClickEvent();
        },
        getselectFilesInfo() {
            let temp = document.querySelectorAll('div[data-index]')
            let attrName;
            for(let attr in temp[0]){
                if(attr.indexOf('__reactFiber')==0){
                    attrName = attr;
                    break;
                }
            }
            temp.forEach((item)=>{
                if(item.querySelector('input')&&item.querySelector('input').checked){
                    let value = item[attrName].return.pendingProps;
                    aliyun._pushItem(value.data[value.index]||value.data[value.rowIndex][value.columnIndex]);
                }
            })
            
        },
        async updateFile(item) {
            Option["list"].push({
                "title": item.name,
                "url": "https://"+item.id
            });
        },
        async openNextDir(item) {
            let url = `https://api.aliyundrive.com/adrive/v3/file/list?jsonmask=next_marker%2Citems(name%2Cfile_id%2Cdrive_id%2Ctype%2Csize%2Ccreated_at%2Cupdated_at%2Ccategory%2Cfile_extension%2Cparent_file_id%2Cmime_type%2Cstarred%2Cthumbnail%2Curl%2Cstreams_info%2Ccontent_hash%2Cuser_tags%2Ctrashed%2Cvideo_media_metadata%2Cvideo_preview_metadata)`,
                token = JSON.parse(localStorage.getItem('token')),
                data = {
                    'drive_id': token.default_drive_id,
                    'parent_file_id': item.id,
                    'limit': 100,
                },
                header = {
                    'x-canary': 'client=web,app=adrive,version=v2.4.0',
                    'x-device-id': document.cookie.match(/cna=([^;]*)/)[1],
                    authorization: `${token.token_type} ${token.access_token}`,
                    'x-signature':this._signature
                };
            await bleu.XHR('POST', url, JSON.stringify(data),header).then((res) => {
                arryIndex++;
                res.items.forEach((item)=>{
                    aliyun._pushItem(item);
                },()=>{
                    bleu.swalInfo("🔴💬刷新页面，重新获取", '', 'center')
                })
            })
        },
        _signature:'',
        findContext(node) {
            node = document.querySelector('ul.ant-dropdown-menu');
            if (!node) return;
            //observer.disconnect();
            contextMenu = node;
            aliyun.addTag();
        },
        closeMenu(){
            contextMenu.parentNode.className='ant-dropdown dropdown-menu--1KRbu ant-dropdown-placement-bottomLeft  ant-dropdown-hidden';
            contextMenu.parentNode.style.left='-578px'; 
            contextMenu.parentNode.style.top='-646px';
        },
        _pushItem(temp) {
            if(!itemsInfo[arryIndex]) itemsInfo[arryIndex]= [];
            if (temp.type==='file'&&temp.category!="video") return
            let itemInfo = {
                'id': temp.fileId||temp.file_id,
                'isdir': temp.type === 'file' ? false : true,
                'name': temp.name,
            };
            itemsInfo[arryIndex].push(itemInfo);
        },
        getHeaderInfo() {
            Option.header ={};
            let token = JSON.parse(localStorage.getItem('token'));
            Option.header["authorization"] =`${token.token_type} ${token.access_token}`;
            Option.header["drive_id"] =token.default_drive_id;
            Option.header["x-signature"]=this._signature;
            Option.header["x-device-id"]=document.cookie.match(/cna=([^;]*)/)[1];
        },
        async finallyFunc(){
            await tools.putFileInWebdav('panvideo.txt', JSON.stringify(Option));
            unsafeWindow.location.href = `potplayer://panvideo##aliyun##https://${bleuc.cip}/PanPlaylist/panvideo.txt##${bleuc.cun}##${bleuc.cpw}`;
        }
    }
    const main = {
        init() {
            observer = new MutationObserver(function (mutations) {
                for (let mutation of mutations) {
                    if (mutation.type === 'childList') {
                        cloud.findContext(mutation.target);
                    }
                }
            });
            observer.observe(document, {
                'childList': true,
                'subtree': true
            });
        },
        addClickEvent() {
            let bleuButton = document.getElementById('bleuReSave');
            bleuButton.addEventListener('click', async function () {
                itemsInfo = [];
                arryIndex = 0;
                Option = {}, Option["list"] = [];
                if(!tools.checkConfig())return;
                cloud.closeMenu();
                cloud.getselectFilesInfo();
                cloud.getHeaderInfo();
                if (itemsInfo[arryIndex].length === 0) {
                    bleu.swalInfo(`❌未选择文件转存!`, 3000, 'center')
                    return;
                }
                await main.updateAllFiles(itemsInfo[arryIndex]);
                Option["list"].length!=0&&cloud.finallyFunc();
            })
        },
        async updateAllFiles(loopArry) {
            for (let index = 0; index < loopArry.length; index++) {
                if (!loopArry[index].isdir) {
                    await cloud.updateFile(loopArry[index]);
                } else {
                    await cloud.openNextDir(loopArry[index]);
                    await main.updateAllFiles(itemsInfo[arryIndex]);
                }
                bleu.sleep(800);
            }
        },
    };
    tools.getCloudName();
    tools.checkConfig();
    bleu.addCssStyle(tools.cssStyle);
    GM_registerMenuCommand('配置WEBDAV', () => {
        bleu.swalUI('WEBDAV', tools.configHtml(), '400px').then(tools.saveConfig)
    }, 'w')
    main.init();
})();