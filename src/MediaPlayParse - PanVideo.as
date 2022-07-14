/*
	PotPlayer云盘-专供版 bleu
*/

// void OnInitialize()
// void OnFinalize()
// string GetTitle() 									-> get title for UI
// string GetVersion									-> get version for manage
// string GetDesc()										-> get detail information
// string GetLoginTitle()								-> get title for login dialog
// string GetLoginDesc()								-> get desc for login dialog
// string GetUserText()									-> get user text for login dialog
// string GetPasswordText()								-> get password text for login dialog
// string ServerCheck(string User, string Pass) 		-> server check
// string ServerLogin(string User, string Pass) 		-> login
// void ServerLogout() 									-> logout
//------------------------------------------------------------------------------------------------
// bool PlayitemCheck(const string &in)					                                            -> check playitem
// string PlayitemParse(const string &in path,dictionary &MetaData, array<dictionary> &QualityList)	-> parse playitem
// bool PlaylistCheck(const string &in)																-> check playlist
// array<dictionary> PlaylistParse(const string &in)												-> parse playlist

string GetTitle()
{
	return "PanVideo";
}

string GetVersion()
{
	return "1.1";
}

string GetDesc()
{
	return "https://github.com/Bleu404/PotplayerPanVideoSV";
}

string USERAGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36";

JsonReader JSON;
JsonValue HEADERS;
int  quIndex;

string getData(string flag)
{
	if (flag == "xl_init") return "{\"client_id\":\"" + HEADERS['clientid'].asString() + "\",\"action\":\"get:/drive/v1/about\",\"device_id\":\"" + HEADERS['x-device-id'].asString() + "\",\"captcha_token\":\"" + HEADERS['x-captcha-token'].asString() + "\",\"meta\":{}}";
	if (flag == "al_item") return "{\"category\":\"live_transcoding\",\"template_id\":\"\",\"drive_id\":\""+HEADERS['drive_id'].asString()+"\",\"file_id\":\"";
	return "";
}

string getHeaders(string flag)
{
	if (flag == "xl_0") return "content-type: text/plain;charset=UTF-8\r\n";
	if (flag == "xl_1") return "authorization: " + HEADERS['Authorization'].asString() + "\r\n" + "content-type: " + HEADERS['content-type'].asString() + "\r\n" + "x-captcha-token: " + HEADERS['x-captcha-token'].asString() + "\r\n" + "x-device-id: " + HEADERS['x-device-id'].asString();
	if (flag == "al_0") return "authorization: " + HEADERS['authorization'].asString() + "\r\n" + "referer: https://www.aliyundrive.com/\r\nx-canary: client=web,app=adrive,version=v2.4.0";
	else return "";
}
bool setQuality(string name,string url,array < dictionary > & QualityList)
{
	array<string> qualities = {"搁置","360", "480","540","720", "1080"};
	dictionary item;
	if(name == "FHD")name = "超清 1080p";
	if(name == "HD")name = "高清 720p";
	if(name == "SD")name = "标清 540p";
	if(name == "LD")name = "流畅 360p";
	string temp = HostRegExpParse(name,"([0-9]+)");
	HostPrintUTF8(temp);
	if (temp!="" && qualities.find(temp) > 0) {
		quIndex = qualities.find(temp);
	} else {
		quIndex++;
	}
	item["itag"] = quIndex;
	item["url"] = url;
	item["quality"] = name;
	QualityList.insertLast(item);
	return true;
}

bool PlayitemCheck(const string & in path)
{
	if(path.find("panvideo") == 0)
	{
		if(HEADERS.isNull()){
			HostPrintUTF8("重新获取头信息");
			string tempstr = HostFileRead(HostFileOpen("Extension\\Media\\PlayParse\\panvideo.txt"), 500);
			tempstr.replace(" ","");
			array < string > temp = tempstr.split("\r\n");
			tempstr = HostUrlGetStringWithAPI("https://"+temp[0]+"/PanPlaylist/panvideo.txt", USERAGENT, "authorization: Basic "+HostBase64Enc(temp[1]+":"+temp[2]), getData(""), false);
			JSON.parse(tempstr, HEADERS);
			HEADERS = HEADERS["header"];
		}
		return true;
	}
	return false;
}

//从opensubtitles.com获取字幕,注册账号并开启API之后每个api每天100（或更多）个字幕
array <dictionary> searchSubtitle(string subname)
{
	array <string> apikey ={};//api用户信息必填
	int subcount = 0;//每个视频获取字幕个数,设置过多，可能无法加载视频
	dictionary subitem;
	array <dictionary> sub;
	JsonValue userjv,fileinfo;
	string subURL,retString;
	if(subcount == 0||apikey.size() == 0)return sub;
	subURL = "https://api.opensubtitles.com/api/v1/subtitles/?languages=en&query="+subname;
	retString = HostUrlGetString(subURL, "PotplayerPanVideoSV", "Content-Type: application/json\r\nApi-Key: "+apikey[0],getData(""), false);
	if(retString == "")return sub;
	JSON.parse(retString,userjv);
	HostPrintUTF8("搜索字幕完毕");
	for(int i = 0;i<subcount;i++)
	{
		int index = i%apikey.size();
		string fileid = userjv["data"][i]["attributes"]["files"][0]["file_id"].asString();
		retString = HostUrlGetString("https://api.opensubtitles.com/api/v1/download", "PotplayerPanVideoSV", "Content-Type: application/json\r\nApi-Key: "+apikey[index],"{\"file_id\":"+fileid+"}", false);
		if(retString == "")continue;
		JSON.parse(retString,fileinfo);
		subitem["name"] = fileinfo["file_name"].asString();
		subitem["url"] = fileinfo["link"].asString();		
		HostPrintUTF8(string(subitem["name"]));
		sub.insertLast(subitem);
		HostPrintUTF8("还剩下："+fileinfo["remaining"].asString());
		HostSleep(100);
	}
	return sub;
}

string PlayitemParse(const string & in path, dictionary & MetaData, array < dictionary > & QualityList)
{
	string ret;
	JsonValue jsonVal;
	array < string > temp = path.split("##");
	if (!PlayitemCheck(path)) return ret;
	string tempstr;
	quIndex = 5;

	//HostOpenConsole();
	if(temp[1]=="xunlei")
	{
		ret = HostUrlGetString(temp[2], USERAGENT, getHeaders("xl_1"), getData(""), false);
		if(ret==""||ret.find("error")>=0)
		{
			string initUrl = "https://xluser-ssl.xunlei.com/v1/shield/captcha/init";
			tempstr = HostUrlGetString(initUrl, USERAGENT, getHeaders("xl_0"),getData("xl_init"), false);
			JSON.parse(tempstr,jsonVal);
			if(jsonVal["captcha_token"].asString()!="")HEADERS['x-captcha-token'] = jsonVal["captcha_token"];
			ret = HostUrlGetString(temp[2], USERAGENT, getHeaders("xl_1"), getData(""), false);
		}
		JSON.parse(ret, jsonVal);

		setQuality("原画 300KB/s",jsonVal["web_content_link"].asString(),QualityList);
		for (int i = 0; i < jsonVal["medias"].size(); i++)
		{
			JsonValue mary = jsonVal["medias"][i];
			if (!mary["link"].canString())
			{
				setQuality(mary["media_name"].asString(),mary["link"]["url"].asString(),QualityList);
				if(i == jsonVal["medias"].size()-1)
				{
					ret = mary["link"]["url"].asString();
				}
			} 
		}
	}
	if(temp[1]=="aliyun")
	{
		temp[2].replace("https://","");
		
		string url = "https://api.aliyundrive.com/v2/file/get_download_url";
		tempstr = HostUrlGetString(url, USERAGENT, getHeaders("al_0"),getData("al_item")+temp[2]+"\"}", false);
		JSON.parse(tempstr,jsonVal);
		//HostPrintUTF8(jsonVal["url"].asString());
		HostSetUrlHeaderHTTP(jsonVal["url"].asString(), "referer: https://www.aliyundrive.com/");
		setQuality("原画",jsonVal["url"].asString(),QualityList);

		url = "https://api.aliyundrive.com/v2/file/get_video_preview_play_info";
		tempstr = HostUrlGetString(url, USERAGENT, getHeaders("al_0"),getData("al_item")+temp[2]+"\"}", false);
		JSON.parse(tempstr,jsonVal);
		JsonValue templist = jsonVal["video_preview_play_info"]["live_transcoding_task_list"];
		for (int i = 0; i < templist.size(); i++)
		{
			HostSetUrlHeaderHTTP(templist[i]["url"].asString(), "referer: https://www.aliyundrive.com/");
			setQuality(templist[i]["template_id"].asString(),templist[i]["url"].asString(),QualityList);
			if(i == templist.size()-1)
			{
				ret = templist[i]["url"].asString();
			}
		}
	}
	MetaData["subtitle"] = searchSubtitle(temp[3]);
	return ret;
}

bool PlaylistCheck(const string & in path)
{
	array < string > temp = path.split("##");
	if (path.find("panvideo") == 0) 
	{
		//JSON.parse(HostUrlDecode(temp[2]), HEADERS); 
		return true;
	}
	return false;
}

array < dictionary > PlaylistParse(const string & in path)
{
	//HostOpenConsole();
	array < dictionary > ret;
	array < string > temp = path.split("##");
	JsonValue Itemlist;
	string tempstr;
	//HostPrintUTF8(temp[3]);
	tempstr = HostUrlGetStringWithAPI(temp[2], USERAGENT, "authorization: Basic "+HostBase64Enc(temp[3]+":"+temp[4]), getData(""), false);
	JSON.parse(tempstr, Itemlist);
	HEADERS = Itemlist["header"];
	Itemlist = Itemlist["list"];
	//HostPrintUTF8(tempstr);
	for (int i = 0; i < Itemlist.size(); i++) 
	{
		dictionary item,subitem;
		item["url"] = "panvideo##"+temp[1]+"##"+Itemlist[i]["url"].asString()+"##"+Itemlist[i]["title"].asString();
		item["title"] = Itemlist[i]["title"].asString();
		ret.insertLast(item);
	}
	return ret;
}
