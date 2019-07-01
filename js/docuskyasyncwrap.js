// manageDataFileListSimpleUI.jsonTransporter deferred wrapper
// jQuery is needed.
function DocuSkyJTD(dsobj){
	var docuSkyObj = dsobj;
	var dfr = $.Deferred();
	
	var reset = function(){
		dfr = $.Deferred();
	}
	
	this.retrieveJson = function(category, datapath, filename, cb_s, cb_f){
		var cb = function(){
			var json = docuSkyObj.jsonTransporter.jsonObj;
			if ('code' in json && 'message' in json){
				dfr.reject({
					"status": "fail",
					"code": json.code,
					"message": json.message,
					"filename": filename
				});
			} else {
				dfr.resolve({
					"status": "success",
					"content": json,
					"filename": filename
				});
			}
			reset();
			return;
		}
		docuSkyObj.jsonTransporter.retrieveJson(category, datapath, filename, cb);
		return dfr.done(cb_s).fail(cb_f).promise();
	}
	
	// Some problems exist in current storeJson. So the function might be changed in the future.
	// 2016/08/13 : Can handle callback now
	this.storeJson = function(category, datapath, filename, json, cb_s, cb_f){
		var transporter = docuSkyObj.jsonTransporter;
		var callback_suc = (is_array(cb_s)) ? cb_s : [];
		var callback_fail = (is_array(cb_f)) ? cb_f : []; 
		transporter.category = category;
		transporter.datapath = datapath;
		transporter.filename = filename;
		
		var cb = function(data){
			// success
			if(data.code === 0){
				dfr.resolve({
					"status": "success",
					"filename": filename
				});
			} else {
				if(data.code !== undefined){	// Problem from docusky
					dfr.reject({
						"status": "fail-ds",
						"code": data.code,
						"message": data.message,
						"filename": filename
					});
				} else {	// Problem from ajax request
					dfr.reject({
						"status": "fail-ajax",
						"message": data,
						"filename": filename
					});
				}				
			}
			reset();
			return;
		}
		transporter.storeJson(json, cb);
		return dfr.done(callback_suc).fail(callback_fail).promise();
	}
}

function DSMultiFileUpload(dsobj, data, cbs_s, cbs_f){
	var cb_done = function(){
		var res = {"status": "success", "files": []};
		for(var i = 0; i < arguments.length; i++){
			res.files.push(arguments[i].filename);
		}
		return res;
	}
	
	var cb_fail = function(data){
		donelist.sort();	// sort names
		return $.extend(data, {"donelist": donelist});
	}
	
	var donelist = [];
	
	var checkdone = function(data){
		donelist.push(data.filename);
	}
	
	var callbacks_suc = (cbs_s && is_array(cbs_s)) ? cbs_s : [];
	var callbacks_fail = (cbs_f && is_array(cbs_f)) ? cbs_f : [];
	
	var defs = [], proms = [];
	for(var i = 0; i < data.length; i++){
		var item = data[i];
		defs.push(new DocuSkyJTD(dsobj));
		proms.push(defs[i].storeJson(item.category, item.datapath, item.filename, item.json, [], []));
		proms[i].done(checkdone);
	}
	
	return $.when.apply($, proms).then(cb_done, cb_fail).done(callbacks_suc).fail(callbacks_fail);
}

function DSMultiFileRetrieve(dsobj, data, cbs_s, cbs_f){
	var cb_done = function(){
		var res = {"status": "success", "files": []};
		for(var i = 0; i < arguments.length; i++){
			res.files.push({"filename": arguments[i].filename, "content": arguments[i].content});
		}
		return res;
	}	
	
	var cb_fail = function(data){
		return data;
	}
	
	var callbacks_suc = (cbs_s && is_array(cbs_s)) ? cbs_s : [];
	var callbacks_fail = (cbs_f && is_array(cbs_f)) ? cbs_f : [];
	var defs = [], proms = [];
	for(var i = 0; i < data.length; i++){
		var item = data[i];
		defs.push(new DocuSkyJTD(dsobj));
		proms.push(defs[i].retrieveJson(item.category, item.datapath, item.filename, [], []));
	}
	
	return $.when.apply($, proms).then(cb_done, cb_fail).done(callbacks_suc).fail(callbacks_fail);
}

function DSGetFileList(dsobj, category, filepath, cbs_s, cbs_f){
	var dfr = $.Deferred();
	
	var callbacks_suc = (cbs_s && is_array(cbs_s)) ? cbs_s : [];
	var callbacks_fail = (cbs_f && is_array(cbs_f)) ? cbs_f : [];
	
	var cb = function(){
		var result = dsobj.jsonTransporter.jsonObj;
		if(result.code === 0){
			var listwithpath = [];
			for(var i = 0; i < result.message.length; i++){
				var item = result.message[i];
				listwithpath.push({
					"category": category,
					"datapath": filepath,
					"filename": item
				});
			}
			dfr.resolve({
				"status": "success",
				"filenamelist": result.message,
				"filelist": listwithpath
			});
		} else {
			dfr.reject({
				"status": "fail",
				"code": result.code,
				"message": result.message
			});
		}
		return;
	};
	dsobj.jsonTransporter.listCategoryDataFiles(category, filepath, cb);
	
	return dfr.done(callbacks_suc).fail(callbacks_fail).promise();
}