# PotplayerPanVideoSV

## 步骤

* 1.打开PotPlayer安装路径，选择目录`Extension\Media\PlayParse`，将复制的`MediaPlayParse - PanVideo.as`和`MediaPlayParse - PanVideo.ico`文件粘贴;
  
  >MediaPlayParse - PanVideo.as[下载地址](https://github.com/Bleu404/PotplayerPanVideoSV/tree/main/src)

* 2.脚本管理器安装[`PotplayerPanVideoSV.js`](https://greasyfork.org/scripts/442448-potplayer%E4%BA%91%E7%9B%98-%E4%B8%93%E4%BE%9B%E7%89%88/code/PotPlayer%E4%BA%91%E7%9B%98-%E4%B8%93%E4%BE%9B%E7%89%88.user.js);

* 3.在脚本管理器中配置WEBDAV`主机`、`用户`、`密码`;
 
  >3.1 注册附带webdav的网盘（坚果云、TeraCLOUD等）、TeraCLOUD用我的推荐码：***DDGYA***，可额外获得5g  
  3.2 密码不是登陆密码，是授权第三方应用的密码  

* 4.选择好需要播放的视频，`右键`=>`PotPlayer打开`;
  
* 5.为了再次打开potplayer，也能播放。在`Extension\Media\PlayParse`文件夹下新建`panvideo.txt`,文件内容为`主机`、`用户`、`密码`，格式如下
  
  ```txt
    dav.jianguoyun.com/dav
    12345678@qq.com
    123456789
  ```

## 字幕

* 1.从[opensubtitles.com](https://www.opensubtitles.com/)获取英文字幕，因为每人网络状况不同，可能出现开启字幕无法加载视频的状况；

* 2.注册账号并开启API之后每个api每天100（或更多）个字幕；
  
* 3.修改`MediaPlayParse - PanVideo.as`中的代码，开启字幕；

* 3.1 添加一个api：`array <string> apikey ={"api"}`;添加两个api：`array <string> apikey ={"api_1","api_2"}`；
  
* 3.2 `int subcount = 0;`//每个视频获取字幕个数,设置过多，可能无法加载视频。

## 其他

* 1.可以在PotPlayer中切换画质；

* 2.迅雷云盘，支持选择原画（非会员只有300KB/s）;

* 3.阿里云盘，支持选择原画，链接的有效期变长了。
  
![画质选择](https://cdn.jsdelivr.net/gh/Bleu404/PotplayerPanVideoSV@1.0.0/清晰度选择.png)
