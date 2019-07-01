/*
	{
		"name": (str),
		"csv": (str)
	}
*/

function uploadtods(){
	var docs = uploadcontents;
	// var csvsetter = [];
	var csvname = document.getElementById("csvlistname").value.trim();
	
	if(docs.length === 0){
		alert("請選擇至少一個檔案上傳。");
		return;
	}
	if(csvname.search(/[\\\/\?\*<":>]/) >= 0){
		alert('檔案名稱不能包含以下字元：\n\\ / ? * < " : >');
		return;
	}
	
	showloading();
	
	var data = [];
	for(var i = 0; i < docs.length; i++){
		var item = docs[i];
		data.push({
			"category": "DocuTools",
			"datapath": "TermStat/TermList/" + csvname,
			"filename": item.name + ".json",
			"json": item
		});
	}
	
	var cb_s = function(data){
		if(data.status === "success"){
			stoploading();
			alert("成功上傳詞彙庫「" + csvname + "」。\n此詞彙庫下的分類詞彙檔案：\n" + data.files.join("\n"));
		}
		return;
	};
	var cb_f = function(data){
		var str = "";
		if(data.status === "fail-ds"){
			str = str + "檔案「" + data.filename + "」上傳DocuSky的過程發生錯誤。\n" + "CODE: " + data.code + "\nMESSAGE: " + data.message + "\n成功上載的檔案如下：\n";
			str = str + data.donelist.join("\n");
			stoploading();
			alert(str);
		} else if (data.status === "fail-ajax"){
			str = str + "檔案「" + data.filename + "」的上傳Request發生錯誤。\n" + "MESSAGE: " + data.message + "\n成功上載的檔案如下：\n";
			str = str + data.donelist.join("\n");
			stoploading();
			alert(str);
		}
		return;
	}
	
	DSMultiFileUpload(docuSkyObj, data, [cb_s], [cb_f]);
}

function readfiles(){
	uploadcontents = [];
	var files = document.getElementById("addfile").files;
	if(files.length === 0){
		return;
	}
		
	var mfr = new MultiFileReader();
	var handler_s = function(data){
		var name = "";
		var subidx;
		for(var i = 0; i < data.length; i++){
			item = data[i];
			subidx = item.name.search(/\.[^\.]+$/gu);
			name = item.name.substring(0, (subidx > 0) ? subidx : undefined);
			uploadcontents.push({
				"name": name,
				"csv": item.content
			});
		}
		stoploading();
	}
	var handler_f = function(data){
		alert("Failed to read file: " + data.name + "\nError: " + data.content.name + "\nMessage: " + data.content.message);
		stoploading();
		return;
	};
	
	showloading();
	mfr.readFiles(files, "text", [handler_s], [handler_f]);
	return;
}

function showloading(){
	spinner.spin(document.getElementById("dtluoverlay_loading"));
	$("#dtluoverlay_loading").show();
}

function stoploading(){
	spinner.stop();
	$("#dtluoverlay_loading").hide();
}

/* Loading spinner settings */
var spinner = new Spinner({
	lines: 13,
	length: 12,
	width: 7,
	radius: 15,
	scale: 1,
	corners: 1,
	color: '#000',
	opacity: 0.15,
	rotate: 6,
	direction: 1,
	speed: 1,
	trail: 50,
	fps: 20,
	zIndex: 2e9,
	className: 'spinner',
	top: '50%',
	left: '50%',
	shadow: false,
	hwaccel: false,
	position: 'absolute'
});

var uploadcontents = [];

$(document).ready(function(e){
	$("#dtluoverlay_loading").hide();
	$("#addfile").change(readfiles);
	$("#uploadfile").click(uploadtods);
});

window.onload = function(e){	
	docuSkyObj = docuskyManageDataFileListSimpleUI;
	$("#dsfilemanager").click(function(e) {
      docuSkyObj.manageDataFileList(e);
    });
}